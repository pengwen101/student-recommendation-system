import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.tsx';
import type { Topic } from '../../types.ts';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faLightbulb } from '@fortawesome/free-solid-svg-icons';

function SelectTopics() {
    const navigate = useNavigate();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [nrp, setNrp] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch user data and topics in parallel for better performance
                const [userRes, topicRes] = await Promise.all([
                    api.get("/users/me"),
                    api.get("/topic")
                ]);

                if (!userRes.data.authenticated) {
                    navigate('/student/login');
                    return;
                }

                setNrp(userRes.data.user_id);
                setTopics(topicRes.data.topics || []);
            } catch (error) {
                let errorMessage = "An unknown error occurred while loading data.";
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                }
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const onSelect = (topic_id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic_id));
        } else {
            setSelectedTopics([...selectedTopics, topic_id]);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nrp) {
            toast.error("User identification missing. Please log in again.");
            return;
        }

        if (selectedTopics.length === 0) {
            toast.error("Please select at least one topic of interest.");
            return;
        }

        setSubmitting(true);
        const student_topics_input = {
            topics: selectedTopics.map((topic_id) => ({
                topic_id: topic_id,
                weight: 1.0
            }))
        };

        try {
            await api.post(`/student/topics/${nrp}`, student_topics_input);
            toast.success("Interests saved successfully!");
            // Redirect back to home/dashboard
            navigate("/home");
        } catch (error) {
            let errorMessage = "Failed to save topics.";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            toast.error(errorMessage);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="text-slate-500 font-medium animate-pulse">Loading topics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 px-6 pb-12">
            
            {/* Header Area */}
            <div className="max-w-2xl w-full text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-6 shadow-sm border border-blue-200">
                    <FontAwesomeIcon icon={faLightbulb} className="text-2xl" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                    What are you interested in?
                </h1>
                <p className="text-slate-500 text-lg">
                    Select the topics you want to learn more about. We'll use these to recommend the best resources, events, and materials for you.
                </p>
            </div>

            {/* Main Selection Area */}
            <div className="max-w-4xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
                <form onSubmit={onSubmit} className="flex flex-col h-full">
                    
                    {topics.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                            {topics.map((topic) => {
                                const isSelected = selectedTopics.some(t => t === topic.topic_id);
                                return (
                                    <button
                                        key={topic.topic_id}
                                        type="button"
                                        onClick={() => onSelect(topic.topic_id, isSelected)}
                                        className={`
                                            relative flex flex-col items-center justify-center p-4 h-24 rounded-2xl border-2 transition-all duration-200 ease-in-out font-medium text-sm
                                            ${isSelected 
                                                ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-md transform -translate-y-1' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm'
                                            }
                                        `}
                                    >
                                        <span className="text-center line-clamp-2 leading-tight px-2">{topic.name}</span>
                                        
                                        {/* Selection Indicator Badge */}
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm">
                                                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-10">
                            No topics currently available to select.
                        </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm font-medium text-slate-500">
                            Selected <span className="font-bold text-blue-600">{selectedTopics.length}</span> topics
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={submitting || selectedTopics.length === 0}
                            className={`
                                px-8 py-3 rounded-xl font-bold transition-all w-full md:w-auto min-w-[200px]
                                ${selectedTopics.length > 0 && !submitting
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {submitting ? 'Saving...' : 'Continue to Dashboard'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default SelectTopics;