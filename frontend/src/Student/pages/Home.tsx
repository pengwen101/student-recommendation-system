import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.tsx';
import type { ResourceRecommendations } from '../../types.ts';
import ResourceCard from "../components/ResourceCard.tsx";

const Home = () => {
    const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                
                const response = await api.get(`/student/topics/has_topics/${userRes.data.user.nrp}`);
                if (!response.data) {
                    navigate("/student/input_topics", {state: {nrp: userRes.data.user.nrp}});
                }

                const recommendations = await api.get(`/student/recommendations/${userRes.data.user.nrp}`);
                setRecommendations(recommendations.data || null); 
            } catch (error) {
                console.error("Failed to load home", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className= "px-8 py-8">
            <div className = "text-xl mb-4">Recommended resources for you</div>
            <div className="flex gap-x-4">
                {loading ? (
                <div className="text-gray-500 animate-pulse">Loading Recommendations...</div>
                ) : (
                    recommendations?.recommendations?.map((rec) => (
                        <ResourceCard 
                            key={rec.resource.resource_id}
                            resource={rec.resource} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Home;