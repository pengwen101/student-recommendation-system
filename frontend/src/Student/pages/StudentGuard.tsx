import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../../api/axios';

const StudentGuard = () => {
    const [status, setStatus] = useState({
        loading: true,
        isAuthenticated: false,
        hasSurvey: false,
        hasTopics: false
    });
    
    const location = useLocation();
    
    // NEW: Keep track of the exact path we just finished verifying
    const [checkedPath, setCheckedPath] = useState('');

    useEffect(() => {
        const checkStudentStatus = async () => {
            setStatus(prev => ({ ...prev, loading: true }));

            try {
                // ==========================================
                // STEP 1: ONLY CHECK AUTHENTICATION FIRST
                // ==========================================
                const userRes = await api.get('/users/me');
                
                if (!userRes.data || !userRes.data.authenticated) {
                    setStatus(prev => ({ ...prev, loading: false, isAuthenticated: false }));
                    return;
                }

                const nrp = userRes.data.user_id;

                // ==========================================
                // STEP 2: CHECK SURVEY & TOPICS
                // ==========================================
                try {
                    const [surveyRes, topicRes] = await Promise.all([
                        api.get(`/student/indicators/has_indicators/${nrp}`), 
                        api.get(`/student/topics/has_topics/${nrp}`)   
                    ]);

                    setStatus({
                        loading: false,
                        isAuthenticated: true,
                        hasSurvey: surveyRes.data.has_indicators || surveyRes.data.is_completed || surveyRes.data === true, 
                        hasTopics: topicRes.data.has_topics || topicRes.data === true
                    });

                } catch (statusError) {
                    console.error("Auth succeeded, but failed to fetch Survey/Topic status:", statusError);
                    setStatus({
                        loading: false,
                        isAuthenticated: true,
                        hasSurvey: false, 
                        hasTopics: false
                    });
                }

            } catch (error) {
                console.error("Authentication check failed:", error);
                setStatus(prev => ({ ...prev, loading: false, isAuthenticated: false }));
            } finally {
                // NEW: Mark this exact URL path as completely checked
                setCheckedPath(location.pathname);
            }
        };

        checkStudentStatus();
    }, [location.pathname]); // Runs every time the route changes

    // --- RENDERING LOGIC ---

    // THE FIX: If the location.pathname changes, checkedPath won't match anymore.
    // This forces the Guard to show the loading screen instead of using stale state to redirect you!
    if (status.loading || checkedPath !== location.pathname) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-slate-500 animate-pulse font-medium">Verifying account status...</div>
            </div>
        );
    }

    if (!status.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!status.hasSurvey && location.pathname !== '/student/survey_assessment') {
        return <Navigate to="/student/survey_assessment" replace />;
    }

    if (status.hasSurvey && !status.hasTopics && location.pathname !== '/student/input_topics') {
        return <Navigate to="/student/input_topics" replace />;
    }

    return <Outlet />;
};

export default StudentGuard;