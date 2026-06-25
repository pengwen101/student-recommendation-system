import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import type { Topic } from '../../types';

// --- TypeScript Interfaces based on FastAPI Models ---

interface IndicatorCalculation {
    code: string;
    name: string;
    weight: number;
}

interface ResourceCalculations {
    indicators: IndicatorCalculation[];
    qualities: Record<string, string | number>[];
    subcpls: Record<string, string | number>[];
}

interface Resource {
    resource_id: string;
    title: string;
    type: 'event' | 'book' | 'video' | 'article';
    is_active: boolean; 
    description?: string; 
    internal_weight: number;
    topics: Topic[];
    calculations: ResourceCalculations;
}

interface Recommendation {
    resource: Resource;
    score: number;
    relative_score?: number;
}

// New interfaces for Student Profile
interface StudentIndicator {
    indicator_id: string;
    code: string;
    name: string;
    weight: number;
}

interface StudentTopic {
    topic_id: string;
    code: string;
    name: string;
}

const RecommendationsPage = () => {
    const [searchParams] = useSearchParams();
    
    // States
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [lackIndicators, setLackIndicators] = useState<StudentIndicator[]>([]);
    const [likedTopics, setLikedTopics] = useState<StudentTopic[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [resourceType, setResourceType] = useState<'event' | 'book' | 'video' | 'article'>('event');

    const nrpMap = {
        "c12250010": "1",
        "d12250086": "2",
        "c14250004": "3",
        "d11250062": "4",
        "d11250051": "5", 
        "b12250025": "6",
        "h15250025": "7",
        "c14250070": "8",
        "g11250010": "9"
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Pull nrp from URL (?nrp=12345) or fallback to the mock value
                const activeNrp = searchParams.get('nrp') || "d12250086"; 

                // Fetch recommendations and profile data in parallel
                const [recsRes, indicatorsRes, topicsRes] = await Promise.all([
                    api.get(`/student/recommendations/${activeNrp}?type=${resourceType}`),
                    api.get(`/student/indicators/lack/${activeNrp}`),
                    api.get(`/student/topics/${activeNrp}`)
                ]);

                setRecommendations(recsRes.data.recommendations || []);
                setLackIndicators(indicatorsRes.data.indicators || []);
                setLikedTopics(topicsRes.data.topics || []);
            } catch (err) {
                console.error("Failed to load data", err);
                setError("Gagal memuat data profil. Silakan coba lagi.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resourceType, searchParams]);

    // Sort student's lacking indicators descending by weight
    const sortedLackIndicators = [...lackIndicators].sort((a, b) => b.weight - a.weight);

    // Map resource types for the UI translation
    const resourceTypesMap = [
        { value: 'event', label: 'Acara' },
        { value: 'book', label: 'Buku' },
        { value: 'video', label: 'Video' },
        { value: 'article', label: 'Artikel' }
    ] as const;

    return (
        <div className="max-w-6xl mx-auto px-6 py-12 md:px-8 min-h-screen bg-slate-50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Mahasiswa {nrpMap[searchParams.get('nrp')]}</h1>
                <p className="text-slate-500 mt-2">Melihat profil pembelajaran dan rekomendasi sumber belajar.</p>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading State (Global) */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="text-slate-500 font-medium animate-pulse">Memuat data...</div>
                </div>
            ) : (
                <>
                    {/* --- Student Profile Section --- */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-10">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Profil Pembelajaran</h2>
                        
                        <div className="flex flex-col gap-8">
                            {/* Liked Topics (Moved to top & full horizontal span) */}
                            <div className="w-full">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Topik yang Disukai Mahasiswa
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {likedTopics.length > 0 ? (
                                        likedTopics.map(topic => (
                                            <span 
                                                key={topic.topic_id} 
                                                title={topic.code}
                                                className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-indigo-200"
                                            >
                                                {topic.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">Belum ada data topik yang disukai.</span>
                                    )}
                                </div>
                            </div>

                            {/* Lack Indicators (Spans horizontal full & added headers) */}
                            <div className="w-full">
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    Area Peningkatan Mahasiswa
                                </h3>
                                <div className="flex flex-col bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
                                    {/* Table Headers */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-amber-100/50 border-b border-amber-200 text-xs font-bold text-amber-800 uppercase tracking-wider">
                                        <span>Indikator</span>
                                        <span className="shrink-0">Bobot Kekurangan</span>
                                    </div>
                                    
                                    {/* Table Body / Rows */}
                                    <div className="flex flex-col divide-y divide-amber-200/60">
                                        {sortedLackIndicators.length > 0 ? (
                                            sortedLackIndicators.map(indicator => (
                                                <div 
                                                    key={indicator.indicator_id} 
                                                    title={indicator.code}
                                                    className="flex justify-between items-center text-amber-900 text-sm px-4 py-3 hover:bg-amber-100/30 transition-colors"
                                                >
                                                    <span className="font-medium pr-4">{indicator.name}</span>
                                                    <span className="font-bold shrink-0 text-amber-700">
                                                        {Number(indicator.weight).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3">
                                                <span className="text-sm text-slate-500 italic">Tidak ada indikator yang memerlukan peningkatan saat ini.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Recommendations Section --- */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-t border-slate-200 pt-8">
                        <h2 className="text-2xl font-bold text-slate-800">Rekomendasi Sumber Belajar</h2>
                        
                        {/* Resource Type Selector */}
                        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
                            {resourceTypesMap.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setResourceType(type.value as any)}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold capitalize transition-all ${
                                        resourceType === type.value
                                            ? 'bg-blue-600 text-white shadow'
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recommendations Grid */}
                    {recommendations.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                            <p className="text-slate-500 italic">Tidak ada rekomendasi {resourceTypesMap.find(t => t.value === resourceType)?.label.toLowerCase()} yang ditemukan saat ini.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {recommendations.map((rec, index) => {
                                const { resource, score } = rec;

                                const sortedIndicators = [...resource.calculations.indicators].sort(
                                    (a, b) => b.weight - a.weight
                                );

                                return (
                                    <div key={`${resource.resource_id}-${index}`} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow">
                                        
                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4 gap-4">
                                            <h3 className="text-xl font-bold text-slate-800 leading-tight">
                                                {resource.title}
                                            </h3>
                                            <span className="shrink-0 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider rounded-full border border-blue-100">
                                                Kecocokan: {(score * 100).toFixed(0)}%
                                            </span>
                                        </div>

                                        {/* Resource Quality (Internal Weight) */}
                                        <div className="mb-4 inline-flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Kualitas Sumber Belajar:
                                            </span>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-sm font-bold rounded">
                                                {resource.internal_weight.toFixed(2)} / 1.0
                                            </span>
                                        </div>

                                        {/* Description (If available) */}
                                        {resource.description && (
                                            <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                                                {resource.description}
                                            </p>
                                        )}

                                        {/* Topics Covered */}
                                        <div className="mb-6">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cakupan Topik</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {resource.topics.length > 0 ? (
                                                    resource.topics.map(topic => (
                                                        <span key={topic.topic_id} className="bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
                                                            {topic.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Tidak ada topik spesifik yang dicantumkan.</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Supported Indicators */}
                                        <div className="mt-auto border-t border-slate-100 pt-4">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Indikator yang Didukung</h4>
                                            <div className="flex flex-col gap-2">
                                                {sortedIndicators.length > 0 ? (
                                                    sortedIndicators.map((indicator, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm">
                                                            <span className="text-slate-700 font-medium">
                                                                {indicator.name}
                                                            </span>
                                                            {/* Weight removed from here per request */}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Tidak ada indikator spesifik yang ditargetkan.</span>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecommendationsPage;