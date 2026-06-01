import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { ResourceRecommendations } from '../../types';
import ResourceCard from "../components/ResourceCard.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faBookOpen, faPlayCircle } from '@fortawesome/free-solid-svg-icons';

const Recommendation = () => {
    // Distinct states for each resource type
    const [eventRecs, setEventRecs] = useState<ResourceRecommendations | null>(null);
    const [bookRecs, setBookRecs] = useState<ResourceRecommendations | null>(null);
    const [videoRecs, setVideoRecs] = useState<ResourceRecommendations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) return;
                const nrp = "h14250080";

                // Fetch recommendations distinctly based on type
                const [events, books, videos] = await Promise.all([
                    api.get(`/student/recommendations/${nrp}?type=event`),
                    api.get(`/student/recommendations/${nrp}?type=book`),
                    api.get(`/student/recommendations/${nrp}?type=video`)
                ]);

                setEventRecs(events.data);
                setBookRecs(books.data);
                setVideoRecs(videos.data);

            } catch (error) {
                console.error("Failed to load recommendations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    // Helper to render a grid layout of ResourceCards matching the top banners
    const renderRecommendationLane = (title: string, data: ResourceRecommendations | null) => {
        const recs = data?.recommendations || [];
        
        return (
            <div className="bg-slate-100 p-6 rounded-2xl mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">{title}</h3>
                
                {recs.length > 0 ? (
                    /* Switched from horizontal flex-row to a vertical responsive grid layout */
                    <div className="flex-row gap-y-6">
                        {recs.map((rec) => (
                            /* Removed absolute min-w/max-w definitions so the width automatically */
                            /* expands to natively track the top banners layout */
                            <div key={rec.resource.resource_id} className="w-full mb-6">
                                <ResourceCard resource={rec.resource} probability_score={rec.probability_score} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-300">
                        No {title.toLowerCase()} currently available.
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-slate-500 animate-pulse font-medium">Loading Recommendations...</div></div>;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-8">
            
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Recommendation Page</h1>
                <p className="text-slate-500 mt-2">Discover curated resources tailored to improve your competencies.</p>
            </div>

            {/* TOP NAVIGATION BANNERS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-200 hover:bg-slate-300 cursor-pointer transition-colors h-40 flex flex-col justify-center items-center text-center p-6 rounded-xl border border-slate-300">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-3xl text-slate-500 mb-3" />
                    <h2 className="text-xl font-bold text-slate-800">Events</h2>
                    <p className="text-slate-600 text-sm mt-1">Discover upcoming events</p>
                </div>
                
                <div className="bg-slate-200 hover:bg-slate-300 cursor-pointer transition-colors h-40 flex flex-col justify-center items-center text-center p-6 rounded-xl border border-slate-300">
                    <FontAwesomeIcon icon={faBookOpen} className="text-3xl text-slate-500 mb-3" />
                    <h2 className="text-xl font-bold text-slate-800">Books</h2>
                    <p className="text-slate-600 text-sm mt-1">Discover books in library</p>
                </div>

                <div className="bg-slate-200 hover:bg-slate-300 cursor-pointer transition-colors h-40 flex flex-col justify-center items-center text-center p-6 rounded-xl border border-slate-300">
                    <FontAwesomeIcon icon={faPlayCircle} className="text-3xl text-slate-500 mb-3" />
                    <h2 className="text-xl font-bold text-slate-800">Videos</h2>
                    <p className="text-slate-600 text-sm mt-1">Discover video tutorials</p>
                </div>
            </div>

            {/* VERTICAL SPECIFIC RECOMMENDATION GRIDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {renderRecommendationLane("Event recommendations", eventRecs)}
                {renderRecommendationLane("Book recommendations", bookRecs)}
                {renderRecommendationLane("Video recommendations", videoRecs)}
            </div>

        </div>
    );
};

export default Recommendation;