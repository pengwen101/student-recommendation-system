import { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import type { Student, Topic, SubCplSupport, CplSupport } from '../../types';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
    const [user, setUser] = useState<Student | null>(null);
    const [cpls, setCpls] = useState<CplSupport[]>([]);
    const [subCpls, setSubCpls] = useState<SubCplSupport[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    // New Interactivity States
    const [selectedCpl, setSelectedCpl] = useState<string | null>(null);
    const [subCplView, setSubCplView] = useState<'top' | 'bottom' | 'all'>('top');

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userRes = await api.get('/users/me');
                if (!userRes.data.authenticated) {
                    window.location.href = '/student/login';
                    return;
                }
                const userData: Student = userRes.data.user;
                setUser(userData);
                
                const nrp = userData.nrp;

                const [cplsRes, subCplsRes, topicsRes] = await Promise.all([
                    api.get(`/student/cpls/${nrp}`),
                    api.get(`/student/subcpls/${nrp}`),
                    api.get(`/student/topics/${nrp}`)
                ]);

                setCpls(cplsRes.data.cpls || []);
                setSubCpls(subCplsRes.data.subcpls || []);
                setTopics(topicsRes.data.topics || []);

            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    // --- 1. DYNAMIC RADAR ZOOM ---
    // Calculate the minimum score so we can "zoom in" the chart. 
    // If lowest score is 7.5, chart starts at 6 instead of 0, exaggerating the differences.
    const radarDomain = useMemo(() => {
        if (cpls.length === 0) return [0, 10];
        const minScore = Math.min(...cpls.map(c => c.weight));
        const chartStart = Math.max(0, Math.floor(minScore) - 1.5); // Give it a 1.5 point buffer
        return [chartStart, 10];
    }, [cpls]);


    // --- 2. SUBCPL FILTERING & SORTING ---
    const displaySubCpls = useMemo(() => {
        let filtered = [...subCpls];

        // Step A: Filter by CPL if one is clicked on the chart
        if (selectedCpl) {
            // Extract the number from the CPL code (e.g. "CPL 1" -> "1", "C2" -> "2")
            const cplNum = selectedCpl.match(/\d+/)?.[0]; 
            if (cplNum) {
                // Keep only SubCPLs that start with 'C{number}' (e.g. C1S1)
                filtered = filtered.filter(sub => sub.code.startsWith(`CPL${cplNum}`));
            }
        }

        // Step B: Sort and Slice based on View Mode
        if (subCplView === 'top') {
            filtered.sort((a, b) => b.weight - a.weight); // Highest first
            if (!selectedCpl) filtered = filtered.slice(0, 5); // Only slice if no specific CPL is selected
        } else if (subCplView === 'bottom') {
            filtered.sort((a, b) => a.weight - b.weight); // Lowest first
            if (!selectedCpl) filtered = filtered.slice(0, 5);
        } else {
            // 'all'
            filtered.sort((a, b) => a.code.localeCompare(b.code)); // Alphabetical
        }

        return filtered;
    }, [subCpls, selectedCpl, subCplView]);


    if (loading) return <div className="flex justify-center items-center h-screen"><div className="text-slate-500 animate-pulse font-medium">Loading Profile...</div></div>;
    if (!user) return <div className="p-8 text-center text-slate-500">Error loading user.</div>;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-8 flex flex-col gap-8">
            
            {/* USER HEADER */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex items-center gap-6">
                <img src={user.picture || 'https://via.placeholder.com/150'} alt="Profile" className="w-24 h-24 rounded-full shadow-sm object-cover border-4 border-slate-50" />
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{user.name}</h1>
                    <p className="text-slate-500 font-medium mt-1">{user.email}</p>
                    <span className="mt-2 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
                        NRP: {user.nrp}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* --- CPL RADAR CHART --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Competency Profile (CPLs)</h3>
                            <p className="text-sm text-slate-500">Click a point on the chart to see specific Sub-CPLs.</p>
                        </div>
                        {selectedCpl && (
                            <button 
                                onClick={() => setSelectedCpl(null)}
                                className="text-xs font-bold bg-primary-50 text-primary-600 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors flex items-center gap-1.5"
                            >
                                <FontAwesomeIcon icon={faTimesCircle} /> Clear Filter
                            </button>
                        )}
                    </div>
                    
                    {cpls.length > 0 ? (
                        <div className="w-full h-[350px] cursor-pointer">
                            <ResponsiveContainer width="100%" height="100%">
                                {/* Added onClick to capture the label (CPL code) when clicked */}
                                <RadarChart 
                                    cx="50%" cy="50%" outerRadius="70%" data={cpls}
                                    onClick={(e) => {
                                        if (e && e.activeLabel) {
                                            const label = String(e.activeLabel);
                                            console.log(label);
                                            setSelectedCpl(prev => prev === label ? null : label);
                                            console.log(selectedCpl);
                                        }
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis 
                                        dataKey="code" 
                                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} 
                                    />
                                    <PolarRadiusAxis angle={30} domain={radarDomain} tick={{ fill: '#94a3b8' }} tickCount={5}/>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f1f5f9' }}
                                    />
                                    <Radar 
                                        name="Score" 
                                        dataKey="weight" 
                                        stroke="#0284c7" 
                                        strokeWidth={3}
                                        fill="url(#colorScore)" 
                                        fillOpacity={1} 
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">No CPL data available.</div>
                    )}
                </div>

                {/* --- SUBCPL PROGRESS & TOPICS --- */}
                <div className="flex flex-col gap-8">
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {selectedCpl ? `Sub-CPLs for ${selectedCpl}` : 'Sub-Competency Mastery'}
                            </h3>
                            
                            {/* Toggle View Buttons (Only show if no specific CPL is selected) */}
                            {!selectedCpl && (
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setSubCplView('top')}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${subCplView === 'top' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >Top 5</button>
                                    <button 
                                        onClick={() => setSubCplView('bottom')}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${subCplView === 'bottom' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >Bottom 5</button>
                                    <button 
                                        onClick={() => setSubCplView('all')}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${subCplView === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    >All</button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-5 max-h-[300px] overflow-y-auto pr-2">
                            {displaySubCpls.length > 0 ? displaySubCpls.map(sub => {
                                const progressPercentage = Math.min(Math.max(sub.weight * 10, 0), 100); 
                                
                                // Color Code the progress bar based on score
                                let barColor = 'bg-primary-500'; // Default Blue
                                if (sub.weight >= 8.5) barColor = 'bg-emerald-500'; // Green (Great)
                                else if (sub.weight <= 6.5) barColor = 'bg-amber-500'; // Orange (Needs Focus)

                                return (
                                    <div key={sub.sub_cpl_id} className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-semibold text-slate-700">
                                                {sub.code} <span className="text-slate-400 font-normal">| {sub.name}</span>
                                            </span>
                                            <span className="font-bold text-slate-900">{sub.weight.toFixed(1)}</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} style={{ width: `${progressPercentage}%` }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-slate-400 italic text-sm text-center py-4">
                                    {selectedCpl ? 'No Sub-CPLs found for this CPL.' : 'No Sub-CPL data recorded.'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- INTERESTED TOPICS (Weights Removed) --- */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">My Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {topics.length > 0 ? topics.map(t => (
                                <span key={t.topic_id} className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-sm px-4 py-2 rounded-xl">
                                    {t.name}
                                </span>
                            )) : (
                                <span className="text-slate-400 italic text-sm">No topics selected.</span>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;