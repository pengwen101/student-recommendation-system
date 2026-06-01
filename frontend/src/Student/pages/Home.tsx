import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { Student, ResourceRecommendations, SubCplSupport, CplSupport } from '../../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ResourceCard from "../components/ResourceCard.tsx";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<Student | null>(null);
    
    // Competency Data
    const [cpls, setCpls] = useState<CplSupport[]>([]);
    const [subCpls, setSubCpls] = useState<SubCplSupport[]>([]);
    const [selectedCpl, setSelectedCpl] = useState<string | null>(null);

    // Recommendations Data
    const [recommendations, setRecommendations] = useState<ResourceRecommendations | null>(null);
    const [articleRecommendations, setArticleRecommendations] = useState<ResourceRecommendations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                const userData: Student = userRes.data;
                setUser(userData);
                const nrp = "h14250080";

                const [cplsRes, subCplsRes, generalRecs, articleRecs] = await Promise.all([
                    api.get(`/student/cpls/${nrp}`),
                    api.get(`/student/subcpls/${nrp}`),
                    api.get(`/student/recommendations/${nrp}?type=event`),
                    api.get(`/student/recommendations/${nrp}?type=article`)
                ]);

                setCpls(cplsRes.data.cpls || []);
                setSubCpls(subCplsRes.data.subcpls || []);
                setRecommendations(generalRecs.data || null);
                setArticleRecommendations(articleRecs.data || null);

            } catch (error) {
                console.error("Error loading home dashboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    // 1. DYNAMIC RADAR ZOOM (Fixed Math.floor bug for 0-1 scale)
    const radarDomain = useMemo(() => {
        if (subCpls.length === 0) return [0, 1];
        const minScore = Math.min(...subCpls.map(c => c.weight));
        return [Math.max(0, minScore - 0.15), 1];
    }, [subCpls]);

    // 2. TRUE CPL GROUPING LOGIC
    const radarGroups = useMemo(() => {
        if (!cpls || !subCpls) return [];

        // Filter active CPLs if one is explicitly selected
        const activeCpls = selectedCpl 
            ? cpls.filter(c => c.code === selectedCpl) 
            : cpls;

        return activeCpls.map(cpl => {
            // Extract the CPL number (e.g., "CPL1" -> "1")
            const cplNumMatch = cpl.code.match(/\d+/);
            const cplNum = cplNumMatch ? cplNumMatch[0] : null;

            // Find matching Sub-CPLs for this specific CPL
            const matchingSubCpls = subCpls.filter(sub => {
                if (!cplNum) return false;
                // Match sub-codes that start with the parent CPL code (e.g., "CPL1S1" starts with "CPL1")
                // Added "S" to ensure "CPL1" doesn't accidentally match "CPL10"
                return sub.code.startsWith(`CPL${cplNum}S`) || sub.code.startsWith(`CPL${cplNum}`);
            });

            return {
                cplId: cpl.code,
                cplScore: cpl.weight,
                data: matchingSubCpls
            };
        }).filter(group => group.data.length > 0); // Hide CPLs that have no recorded subCpls
    }, [cpls, subCpls, selectedCpl]);

    const topRecommendations = useMemo(() => {
        return recommendations?.recommendations?.slice(0, 5) || [];
    }, [recommendations]);

    const topArticles = useMemo(() => {
        return articleRecommendations?.recommendations?.slice(0, 8) || [];
    }, [articleRecommendations]);


    if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-slate-500 animate-pulse font-medium">Loading Dashboard...</div></div>;
    if (!user) return <div className="p-8 text-center text-slate-500">Error loading user.</div>;

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-8 md:px-8 flex flex-col gap-6">
            
            {/* HEADER: Student Profile & Name */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-4">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Profile</h1>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                    <p className="text-slate-500 text-sm font-medium">{user.nrp}</p>
                </div>
            </div>

            {/* MAIN GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* LEFT COLUMN (Spans 3 cols): Radar Charts & Recommendations Sneak Peek */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    
                    {/* Radar Charts Area Grouped by CPL */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Competency Breakdown</h3>
                                <p className="text-xs text-slate-500">Click a card to filter and focus on a specific CPL.</p>
                            </div>
                            {selectedCpl && (
                                <button onClick={() => setSelectedCpl(null)} className="text-xs font-bold text-blue-600 hover:underline">
                                    <FontAwesomeIcon icon={faTimesCircle} className="mr-1" /> Clear Filter ({selectedCpl})
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {radarGroups.map((group) => (
                                <div 
                                    key={group.cplId} 
                                    className="flex flex-col items-center justify-between bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-[280px] cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
                                    onClick={() => setSelectedCpl(prev => prev === group.cplId ? null : group.cplId)}
                                >
                                    <div className="w-full h-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={group.data}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="code" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                                                <PolarRadiusAxis angle={30} domain={radarDomain} tick={false}/>
                                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                <Radar name="Mastery" dataKey="weight" stroke="#0284c7" strokeWidth={2} fill="#38bdf8" fillOpacity={0.3} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    {/* CPL Score Section added here */}
                                    <div className="text-center mt-2 w-full pt-3 border-t border-slate-100">
                                        <h4 className="font-bold text-slate-800 leading-none">{group.cplId}</h4>
                                        <span className="text-xs font-bold text-slate-500 tracking-wide uppercase mt-1 inline-block">
                                            Score: <span className="text-blue-600">{(group.cplScore * 100).toFixed(1)}%</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {radarGroups.length === 0 && (
                                <div className="col-span-3 text-center text-slate-400 italic text-sm py-10">No Sub-CPL data available.</div>
                            )}
                        </div>
                    </div>

                    {/* Recommendations Sneak Peek */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Recommendations (Sneak Peek)</h3>
                            <button onClick={() => navigate('/recommendations')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2">
                                View All <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                        
                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar">
                            {topRecommendations.map((rec) => (
                                <div key={rec.resource.resource_id} className="min-w-[280px] max-w-[280px] h-[260px] snap-start shrink-0">
                                    <ResourceCard resource={rec.resource} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (Spans 1 col): Recommended Articles List */}
                <div className="lg:col-span-1 bg-slate-100 rounded-2xl p-6 border border-slate-200 flex flex-col h-full">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Recommended Articles</h3>
                    
                    <div className="flex flex-col gap-3 overflow-y-auto">
                        {topArticles.length > 0 ? topArticles.map(rec => (
                            <button 
                                key={rec.resource.resource_id}
                                className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 text-left flex flex-col gap-1"
                                onClick={() => navigate(`/resource/${rec.resource.resource_id}`)}
                            >
                                <span className="font-bold text-slate-800 line-clamp-2 text-sm leading-tight">
                                    {rec.resource.title}
                                </span>
                            </button>
                        )) : (
                            <div className="text-center text-slate-400 text-sm italic py-10">No articles recommended at this time.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;