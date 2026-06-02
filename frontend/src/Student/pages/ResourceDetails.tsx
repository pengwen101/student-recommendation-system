import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import type { 
    Resource, ResourceEvent, ResourceBook, ResourceVideo, ResourceArticle, SubCplSupport, Topic 
} from '../../types.ts';
import api from '../../api/axios.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Editor from '../../components/Editor';
import { 
    faCalendar, faArrowLeft, faCheckCircle, faExternalLink,
    faBullseye, faLightbulb, faBook, faBuilding, faUserNinja
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
                
                const nrp = userRes.data.user_id;
                const [resourceRes, studentSubCplRes, studentTopicRes] = await Promise.all([
                    api.get(`/resource/${resource_id}`),
                    api.get(`/student/subcpls/${nrp}`),
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

    // Helper to safely display article payload using the read-only Editor
    const renderArticleText = (article: ResourceArticle) => {
        if (!article.article_text) return null;
        
        let parsedData;
        try {
            // Safely parse if it's a string, otherwise use it directly
            parsedData = typeof article.article_text === 'string' 
                ? JSON.parse(article.article_text) 
                : article.article_text;
        } catch (error) {
            console.error("Failed to parse article text JSON:", error);
            return <p className="text-slate-500 italic">Error loading article content.</p>;
        }

        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <Editor 
                    editorBlock={`viewer-${article.resource_id}`} 
                    data={parsedData}
                    readOnly={true} 
                />
            </div>
        );
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
                <Link to="/recommendations" className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors flex items-center gap-2 w-fit">
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
                </Link>
            </div>

            {/* HEADER SECTION */}
            <div className="flex flex-col gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {resource.type}
                    </span>
                    {resource.type === 'event' && (resource as ResourceEvent).status && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${(resource as ResourceEvent).status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {(resource as ResourceEvent).status}
                        </span>
                    )}
                </div>
                
                {/* Fixed property from resource.name to resource.title */}
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{resource.title}</h1>
                
                <div className="mt-2 max-w-3xl">
                    {resource.type === 'article' ? (
                        renderArticleText(resource as ResourceArticle)
                    ) : (
                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-line">
                            {(resource as ResourceEvent | ResourceBook | ResourceVideo).description}
                        </p>
                    )}
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Gaps Matching & Full Curriculum */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    
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

                    {/* All Coverage Section */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">Full Curriculum Covered</h2>
                        <div className="flex flex-col gap-2">
                            {resource.calculations?.subcpls?.map((subcpl) => (
                                <div key={subcpl.sub_cpl_id} className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                    <span><strong>{subcpl.code}</strong> | {subcpl.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Type-Specific Logistics Panel */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
                        
                        {/* 1. LAYOUT FOR EVENTS */}
                        {resource.type === 'event' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                                    Schedule & Sessions
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {(resource as ResourceEvent).sessions?.map((session, idx) => (
                                        <div key={session.session_id || idx} className="flex gap-3 items-start">
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
                                    {(!(resource as ResourceEvent).sessions || (resource as ResourceEvent).sessions.length === 0) && (
                                        <div className="text-sm text-slate-500 italic">No scheduled dates found.</div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 2. LAYOUT FOR BOOKS */}
                        {resource.type === 'book' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                                    Library Meta
                                </h2>
                                <div className="flex flex-col gap-4 text-sm text-slate-700">
                                    <div className="flex gap-3 items-center">
                                        <FontAwesomeIcon icon={faUserNinja} className="w-4 text-slate-400 text-center" />
                                        <div><strong>By:</strong> {(resource as ResourceBook).authors?.join(', ') || 'Unknown Author'}</div>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <FontAwesomeIcon icon={faBuilding} className="w-4 text-slate-400 text-center" />
                                        <div><strong>Publisher:</strong> {(resource as ResourceBook).publisher || 'N/A'}</div>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <FontAwesomeIcon icon={faBook} className="w-4 text-slate-400 text-center" />
                                        <div><strong>Published:</strong> {(resource as ResourceBook).published_date || 'N/A'}</div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 3. LAYOUT FOR VIDEOS */}
                        {resource.type === 'video' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                                    Video Tutorial
                                </h2>
                                <p className="text-sm text-slate-500 mb-4">This digital video resource can be accessed instantly online.</p>
                                <a 
                                    href={(resource as ResourceVideo).content_link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full inline-flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors shadow-sm text-center"
                                >
                                    Watch Material <FontAwesomeIcon icon={faExternalLink} className="w-3 h-3" />
                                </a>
                            </>
                        )}

                        {/* 4. LAYOUT FOR ARTICLES */}
                        {resource.type === 'article' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">
                                    Article Reading
                                </h2>
                                <p className="text-sm text-slate-500">This reading module is directly synchronized to build up missing competency parameters in your portfolio framework.</p>
                            </>
                        )}
                        
                    </div>
                </div>

            </div>
        </div>
    );
}

export default ResourceDetails;