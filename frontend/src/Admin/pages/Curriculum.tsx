import { Panel, Group, Separator } from "react-resizable-panels";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.tsx';
import type { CPL, SubCpl } from '../../types.ts'; 

function Curriculum() {
    const [curriculum, setCurriculum] = useState<CPL[]>([]);
    const [versionId, setVersionId] = useState<string>("1");
    const [loading, setLoading] = useState<boolean>(true);

    const [expandedCplId, setExpandedCplId] = useState<string | null>(null);
    const [selectedSubCpl, setSelectedSubCpl] = useState<SubCpl | null>(null);

    useEffect(() => {
        const initializeCurriculum = async () => {
            setLoading(true);
            try {
                const result = await api.get(`/curriculum/${versionId}`);
                setCurriculum(result.data.curriculum || null); 
            } catch (error) {
                let errorMessage = "An unknown error occurred";
                if (error instanceof Error) errorMessage = error.message;
                else if (typeof error === 'string') errorMessage = error;
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        initializeCurriculum();
    }, [versionId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading curriculum...</div>;

    return (
        <div className="h-screen bg-gray-50 flex flex-col relative font-sans">
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4 z-10 shadow-sm">
                <label className="font-semibold text-gray-700">Curriculum Version:</label>
                <select
                    value={versionId}
                    onChange={(e) => setVersionId(e.target.value)}
                    className="border border-gray-300 p-2 rounded text-gray-700 bg-white outline-none focus:border-blue-500 font-medium"
                >
                    <option value="1">1</option>
                </select>
            </div>
            
            <div className="flex-1 relative">
                <Group orientation="horizontal" className="h-full">
                    
                    {/* LEFT PANE */}
                    <Panel defaultSize={30} minSize={20}>
                        <div className="h-full overflow-y-auto bg-white flex flex-col">
                            <div className="p-4 border-b bg-slate-50 font-bold text-slate-800">
                                Curriculum Structure
                            </div>
                            
                            <div className="flex-1 p-4 space-y-3">
                                {curriculum?.map((cpl) => (
                                    <div key={cpl.cpl_id} className="border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                        <button 
                                            onClick={() => setExpandedCplId(expandedCplId === cpl.cpl_id ? null : cpl.cpl_id)}
                                            className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex justify-between items-center transition-colors"
                                        >
                                            <span className="pr-2">{cpl.code} | {cpl.name}</span>
                                            <span className="text-xs text-slate-400 shrink-0">{expandedCplId === cpl.cpl_id ? '▼' : '▶'}</span>
                                        </button>
                                        
                                        {expandedCplId === cpl.cpl_id && (
                                            <div className="bg-white p-2 space-y-1 border-t border-slate-100">
                                                {(!cpl.subcpls || cpl.subcpls.length === 0) && (
                                                    <p className="text-sm text-slate-400 p-2 italic">No Sub-CPLs found.</p>
                                                )}
                                                {cpl.subcpls?.map((subcpl) => {
                                                    const isSelected = selectedSubCpl?.sub_cpl_id === subcpl.sub_cpl_id;
                                                    return (
                                                        <button
                                                            key={subcpl.sub_cpl_id}
                                                            onClick={() => setSelectedSubCpl(subcpl)}
                                                            className={`w-full text-left text-sm p-2.5 rounded transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200' 
                                                                    : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                                                            }`}
                                                        >
                                                            • {subcpl.code} | {subcpl.name}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Panel>

                    <Separator className="w-1.5 bg-slate-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

                    {/* RIGHT PANE */}
                    <Panel minSize={30}>
                        <div className="h-full overflow-y-auto bg-slate-50 p-6 md:p-8">
                            {!selectedSubCpl ? (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <p className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                                        Select a Sub-CPL from the left to view its mapped structure.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="border-b border-slate-200 pb-4 mb-8">
                                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                            {selectedSubCpl.code} Mapping Details
                                        </h2>
                                        <p className="text-slate-500 mt-1">{selectedSubCpl.name}</p>
                                    </div>

                                    {(!selectedSubCpl.qualities || selectedSubCpl.qualities.length === 0) ? (
                                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 italic">
                                            No qualities mapped to this Sub-CPL yet.
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {selectedSubCpl.qualities.map((quality) => (
                                                <div key={quality.quality_id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                                    
                                                    {/* Quality Header */}
                                                    <div className="bg-slate-100/50 p-4 border-b border-slate-200 flex justify-between items-center gap-4">
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quality</span>
                                                            <h3 className="font-bold text-slate-800 text-lg">{quality.code} | {quality.name}</h3>
                                                        </div>
                                                        <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-lg font-bold border border-blue-200 shrink-0">
                                                            Weight: {quality.weight ?? '0.0'}
                                                        </span>
                                                    </div>

                                                    {/* Indicators List */}
                                                    <div className="p-5 space-y-6">
                                                        {(!quality.indicators || quality.indicators.length === 0) ? (
                                                            <p className="text-slate-400 italic text-sm">No indicators mapped to this quality.</p>
                                                        ) : (
                                                            quality.indicators.map((indicator) => (
                                                                <div key={indicator.indicator_id} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                                                                    <div className="mb-3">
                                                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Indicator</span>
                                                                         <h4 className="font-semibold text-slate-700">{indicator.code} | {indicator.name}</h4>
                                                                    </div>
                                                                    
                                                                    {/* Questions Table */}
                                                                    {(!indicator.questions || indicator.questions.length === 0) ? (
                                                                        <p className="text-slate-400 italic text-xs">No questions mapped to this indicator.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
                                                                            <table className="w-full text-left bg-white">
                                                                                <thead className="bg-slate-100 text-xs text-slate-600 uppercase tracking-wider">
                                                                                    <tr>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200">Question Code</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200">Question Name</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200 text-center">Lower Bound</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200 text-center">Upper Bound</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                                                    {indicator.questions.map((q) => (
                                                                                        <tr key={q.question_id} className="hover:bg-slate-50/50 transition-colors">
                                                                                            <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{q.code}</td>
                                                                                            <td className="p-3 text-slate-600">{q.name}</td>
                                                                                            <td className="p-3 text-center">
                                                                                                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold" title={q.lower_text}>
                                                                                                    {q.lower_bound}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="p-3 text-center">
                                                                                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold" title={q.upper_text}>
                                                                                                    {q.upper_bound}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Panel>
                </Group>
            </div>
        </div>
    );
}

export default Curriculum;