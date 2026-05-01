import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import type { Resource, SubCplSupport, Topic } from '../../types.ts';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendar, faArrowLeft, faCheckCircle, 
    faBullseye, faLightbulb, faGraduationCap, faUsers
} from '@fortawesome/free-solid-svg-icons';

function ResourceDetails() {
    const { resource_id } = useParams();

    // State
    const [resource, setResource] = useState<Resource | null>(null);
    const [studentSubCpl, setStudentSubCpl] = useState<SubCplSupport[]>([]);
    const [studentTopic, setStudentTopic] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                
                // Safely extract NRP depending on your exact backend payload structure
                const nrp = userRes.data.user?.nrp || userRes.data.nrp;

                const [resourceRes, studentSubCplRes, studentTopicRes] = await Promise.all([
                    api.get(`/resource/${resource_id}`),
                    api.get(`/student/subcpls/h14250080`),
                    api.get(`/student/topics/${nrp}`)
                ]);
                
                setResource(resourceRes.data.resource_details || resourceRes.data || null);
                setStudentSubCpl(studentSubCplRes.data.subcpls || []);
                setStudentTopic(studentTopicRes.data.topics || []);
            } catch (error) {
                console.error("Failed to load resource", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [resource_id]);

    // --- MATCHING LOGIC ---
    const matchingSubCpls = useMemo(() => {
        if (!resource?.calculations?.subcpls) return [];
        return resource.calculations.subcpls.filter(resSub => 
            studentSubCpl.some(stuSub => stuSub.sub_cpl_id === resSub.sub_cpl_id)
        );
    }, [resource, studentSubCpl]);

    const matchingTopics = useMemo(() => {
        if (!resource?.topics) return [];
        return resource.topics.filter(resTop => 
            studentTopic.some(stuTop => stuTop.topic_id === resTop.topic_id)
        );
    }, [resource, studentTopic]);

    // --- HELPERS ---
    const formatSessionRange = (startStr?: string, endStr?: string) => {
        if (!startStr || !endStr) return 'TBA';
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        
        const datePart = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        return `${datePart}, ${startTime} - ${endTime}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-slate-500 animate-pulse font-medium">Loading Resource Details...</div>
            </div>
        );
    }

    if (!resource) {
        return <div className="p-8 text-center text-slate-500">Resource not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 md:px-8 flex flex-col gap-8">
            
            {/* Back Button */}
            <div>
                <Link to="/home" className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors flex items-center gap-2 w-fit">
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
                </Link>
            </div>

            {/* HEADER SECTION */}
            <div className="flex flex-col gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {resource.type}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${resource.status === 'open' ? 'bg-success-50 text-success-700' : 'bg-slate-100 text-slate-600'}`}>
                        {resource.status}
                    </span>
                    {resource.scale && (
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faUsers} className="w-3 h-3"/> {resource.scale}
                        </span>
                    )}
                    {resource.speaker_degree && (
                        <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faGraduationCap} className="w-3 h-3"/> {resource.speaker_degree}
                        </span>
                    )}
                </div>
                
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{resource.name}</h1>
                <p className="text-slate-600 text-base leading-relaxed max-w-3xl whitespace-pre-line">
                    {resource.description}
                </p>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Why it matches & Full Syllabus */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
                    {/* The Match Section */}
                    <div className="bg-primary-50/50 p-6 rounded-2xl border border-primary-100">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-primary-600" />
                            Why this matches your profile
                        </h2>
                        
                        <div className="flex flex-col gap-6">
                            {/* SubCpl Match */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBullseye} className="text-slate-400" />
                                    Addresses your Sub-CPL Gaps
                                </h3>
                                {matchingSubCpls.length > 0 ? (
                                    <ul className="flex flex-col gap-2">
                                        {matchingSubCpls.map(sc => (
                                            <li key={sc.sub_cpl_id} className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-primary-100 shadow-sm flex justify-between items-center">
                                                <span><strong className="text-slate-900">{sc.code}</strong>: {sc.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500 italic bg-white/50 p-3 rounded-lg border border-slate-200">
                                        This resource does not directly address any of your currently lacking Sub-CPLs.
                                    </p>
                                )}
                            </div>

                            {/* Topic Match */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faLightbulb} className="text-slate-400" />
                                    Aligns with your Interests
                                </h3>
                                {matchingTopics.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {matchingTopics.map(topic => (
                                            <span key={topic.topic_id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-primary-700 border border-primary-200 shadow-sm">
                                                {topic.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic bg-white/50 p-3 rounded-lg border border-slate-200">
                                        This resource does not cover topics you explicitly marked as interests.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* All Coverage Section (Optional, showing everything) */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Full Curriculum Covered</h2>
                        <div className="flex flex-col gap-2">
                            {resource.calculations?.subcpls?.map((subcpl) => (
                                <div key={subcpl.sub_cpl_id} className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                    <span><strong>{subcpl.code}</strong> | {subcpl.name}</span>
                                    {/* Optional: Show weight if needed */}
                                    {/* <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border">Weight: {subcpl.weight.toFixed(2)}</span> */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Schedule & Logistics */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                            Schedule & Sessions
                        </h2>
                        
                        {resource.sessions && resource.sessions.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {resource.sessions.map((session, idx) => (
                                    <div key={idx} className="flex gap-3 items-start">
                                        <div className="mt-1 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 shrink-0">
                                            <FontAwesomeIcon icon={faCalendar} className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session {idx + 1}</span>
                                            <span className="text-sm font-medium text-slate-700 mt-0.5">
                                                {formatSessionRange(session.start_datetime, session.end_datetime)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 italic">No specific dates scheduled. Available anytime.</div>
                        )}
                        
                        {resource.status === 'open' && (
                            <button className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm">
                                Register / Access Resource
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ResourceDetails;