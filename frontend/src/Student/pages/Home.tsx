import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.tsx';
import type { ResourceRecommendations, Resource, Topic } from '../../types.ts';
import ResourceCard from "../components/ResourceCard.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
    const navigate = useNavigate();
    
    // Data States
    const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterTopic, setFilterTopic] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                
                const nrp = userRes.data.user.nrp;
                const hasTopicsRes = await api.get(`/student/topics/has_topics/${nrp}`);
                if (!hasTopicsRes.data) {
                    navigate("/student/input_topics", { state: { nrp } });
                    return;
                }

                // 2. Fetch All Necessary Data in Parallel
                const [recsRes, resourcesRes, topicsRes] = await Promise.all([
                    api.get(`/student/recommendations/${nrp}`),
                    api.get('/resource'), // Returns all active resources
                    api.get('/topic')     // Returns available topics for the filter
                ]);

                setRecommendations(recsRes.data || null);
                setAllResources(resourcesRes.data.resources || []);
                setTopics(topicsRes.data.topics || []);

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // --- HELPER: Get the earliest FUTURE session date for an event ---
    const getEarliestFutureDate = (resource: Resource, now: number) => {
        if (!resource.sessions || resource.sessions.length === 0) return null;
        
        // Find all sessions that haven't happened yet
        const futureSessions = resource.sessions.filter(s => 
            s.start_datetime && new Date(s.start_datetime).getTime() > now
        );
        
        if (futureSessions.length === 0) return null;
        
        // Return the closest upcoming date
        const futureDates = futureSessions.map(s => new Date(s.start_datetime).getTime());
        return Math.min(...futureDates);
    };

    // --- DERIVED DATA & FILTERING ---

    // 1. Top 10 Recommendations
    const topRecommendations = useMemo(() => {
        return recommendations?.recommendations?.slice(0, 10) || [];
    }, [recommendations]);

    // 2. Upcoming Events (Future sessions, sorted closest first)
    const upcomingEvents = useMemo(() => {
        const now = new Date().getTime();
        return allResources
            .filter(r => r.type === 'event' && getEarliestFutureDate(r, now) !== null)
            .sort((a, b) => getEarliestFutureDate(a, now)! - getEarliestFutureDate(b, now)!)
            .slice(0, 10);
    }, [allResources]);

    // 3. Search & Filter Results
    const isSearching = searchQuery || filterYear || filterMonth || filterTopic;
    
    const searchResults = useMemo(() => {
        if (!isSearching) return [];
        return allResources.filter(resource => {
            // Check Search Match
            const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
            
            // Check Topic Match
            const matchesTopic = filterTopic ? resource.topics?.some(t => t.topic_id === filterTopic) : true;

            // Check Date Match (Does ANY session fall into the selected year/month?)
            let matchesDate = true;
            if (filterYear || filterMonth) {
                if (!resource.sessions || resource.sessions.length === 0) {
                    matchesDate = false; // Has date filters, but no dates to check
                } else {
                    matchesDate = resource.sessions.some(session => {
                        if (!session.start_datetime) return false;
                        const d = new Date(session.start_datetime);
                        const sessionYear = d.getFullYear().toString();
                        const sessionMonth = (d.getMonth() + 1).toString();

                        const yearMatch = filterYear ? sessionYear === filterYear : true;
                        const monthMatch = filterMonth ? sessionMonth === filterMonth : true;

                        return yearMatch && monthMatch;
                    });
                }
            }

            return matchesSearch && matchesTopic && matchesDate;
        });
    }, [allResources, searchQuery, filterYear, filterMonth, filterTopic, isSearching]);


    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-8 flex flex-col gap-10">
            
            {/* --- TOP SECTION: SEARCH & FILTERS --- */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row gap-4">
                    
                    {/* Search Bar */}
                    <div className="relative grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search resources, events, or books..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                        <select 
                            value={filterYear} onChange={(e) => setFilterYear(e.target.value)}
                            className="py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-700 min-w-[100px] focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Any Year</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>

                        <select 
                            value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                            className="py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-700 min-w-[120px] focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Any Month</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>

                        <select 
                            value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}
                            className="py-2.5 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-700 min-w-[140px] focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">All Topics</option>
                            {topics.map(t => (
                                <option key={t.topic_id} value={t.topic_id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse font-medium">
                    Curating your dashboard...
                </div>
            ) : isSearching ? (
                
                /* SEARCH RESULTS GRID */
                <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-slate-900">
                        Search Results <span className="text-slate-500 font-medium text-base ml-2">({searchResults.length})</span>
                    </h2>
                    {searchResults.length === 0 ? (
                        <div className="text-slate-500 py-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            No resources found matching your filters.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {searchResults.map(resource => (
                                <div key={resource.resource_id} className="h-[360px]">
                                    <ResourceCard resource={resource} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            ) : (
                
                /* DEFAULT DASHBOARD (Sliders) */
                <div className="flex flex-col gap-12">
                    
                    {/* SECTION 1: Top Recommendations */}
                    {topRecommendations.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Top Matches for You</h2>
                            </div>
                            
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 px-6 md:px-8 hide-scrollbar">
                                {topRecommendations.map((rec) => (
                                    <div key={rec.resource.resource_id} className="min-w-[300px] md:min-w-[340px] max-w-[340px] h-[360px] snap-start shrink-0">
                                        <ResourceCard 
                                            resource={rec.resource} 
                                            probability_score={rec.probability_score} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* SECTION 2: Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Upcoming Events</h2>
                            </div>
                            
                            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 -mx-6 px-6 md:-mx-8 md:px-8 hide-scrollbar">
                                {upcomingEvents.map((event) => (
                                    <div key={event.resource_id} className="min-w-[300px] md:min-w-[340px] max-w-[340px] h-[360px] snap-start shrink-0">
                                        <ResourceCard resource={event} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;