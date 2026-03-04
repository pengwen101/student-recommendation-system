import { useEffect, useState } from 'react';
import api from '../api/axios';
import type { ResourceRecommendations } from '../types';
import ResourceCard from "../components/ResourceCard.tsx";

const Home = () => {
    const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Current User to find their ID
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/login';
                    return;
                }

                // 2. Use ID to get Recommendations
                const recommendations = await api.get(`/student/recommendations/${userRes.data.user.nrp}`);
                
                // Assuming backend returns { recommendations: [...] }
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
                    recommendations?.recommendations?.map((rec, index) => (
                        <ResourceCard 
                            key={rec.resource.resource_id || index}
                            resource={rec.resource} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Home;