import { Panel, Group, Separator } from "react-resizable-panels";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.tsx';
import type { CPL, SubCpl } from '../../types.ts'; 

function Curriculum() {
    const [curriculum, setCurriculum] = useState<CPL[]>([]);
    const [versionId, setVersionId] = useState<string>("25/26");
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
        <div className="h-screen bg-gray-50 flex flex-col relative">
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4 z-10">
                <label className="font-semibold text-gray-700">Curriculum Version:</label>
                <select
                    value={versionId}
                    onChange={(e) => setVersionId(e.target.value)}
                    className="border border-gray-300 p-2 rounded text-gray-700 bg-white outline-none focus:border-blue-500"
                >
                    <option value="24-25">2024 / 2025</option>
                    <option value="25-26">2025 / 2026</option>
                    <option value="26-27">2026 / 2027</option>
                </select>
            </div>
            
            <div className="flex-1 relative">
                
                {/* 2. UPDATED: Using 'Group' and 'orientation' */}
                <Group orientation="horizontal" className="h-full">
                    
                    {/* LEFT PANE */}
                    <Panel defaultSize={30} minSize={20}>
                        <div className="h-full overflow-y-auto bg-white flex flex-col">
                            <div className="p-4 border-b bg-gray-100 font-bold text-gray-700">
                                Curriculum Structure
                            </div>
                            
                            <div className="flex-1 p-4 space-y-2">
                                {curriculum?.map((cpl) => (
                                    <div key={cpl.cpl_id} className="border rounded shadow-sm">
                                        <button 
                                            onClick={() => setExpandedCplId(expandedCplId === cpl.cpl_id ? null : cpl.cpl_id)}
                                            className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 font-semibold flex justify-between items-center"
                                        >
                                            <span>{cpl.code} | {cpl.name}</span>
                                            <span>{expandedCplId === cpl.cpl_id ? '▼' : '▶'}</span>
                                        </button>
                                        {expandedCplId === cpl.cpl_id && (
                                            <div className="bg-white p-2 space-y-1">
                                                {cpl.subcpls?.length === 0 && (
                                                    <p className="text-sm text-gray-400 p-2">No Sub-CPLs found.</p>
                                                )}
                                                {cpl.subcpls?.map((subcpl) => {
                                                    const isSelected = selectedSubCpl?.sub_cpl_id === subcpl.sub_cpl_id;
                                                    return (
                                                        <button
                                                            key={subcpl.sub_cpl_id}
                                                            onClick={() => setSelectedSubCpl(subcpl)}
                                                            className={`w-full text-left text-sm p-2 rounded transition-colors ${
                                                                isSelected 
                                                                    ? 'bg-blue-100 text-blue-800 font-medium border border-blue-200' 
                                                                    : 'hover:bg-gray-50 text-gray-600'
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

                    {/* 3. UPDATED: Using 'Separator' */}
                    <Separator className="w-1.5 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

                    {/* RIGHT PANE */}
                    <Panel minSize={30}>
                        <div className="h-full overflow-y-auto bg-gray-50 p-8">
                            {!selectedSubCpl ? (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p>Select a Sub-CPL from the left to view its mapped Qualities.</p>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="border-b pb-4 mb-6">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {selectedSubCpl.code} Qualities
                                        </h2>
                                        <p className="text-gray-500">{selectedSubCpl.name}</p>
                                    </div>

                                    <div className="bg-white border rounded shadow-sm p-4">
                                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                                            <h3 className="font-semibold text-gray-700">Mapped Qualities</h3>
                                            <button className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700">
                                                + Edit Links
                                            </button>
                                        </div>

                                        {selectedSubCpl.qualities?.length === 0 ? (
                                            <p className="text-gray-500 italic py-4">No qualities mapped to this Sub-CPL yet.</p>
                                        ) : (
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="py-2">Code</th>
                                                        <th className="py-2">Quality Name</th>
                                                        <th className="py-2 text-center">Weight</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {selectedSubCpl.qualities?.map((quality) => (
                                                        <tr key={quality.quality_id} className="hover:bg-gray-50">
                                                            <td className="py-3 font-medium text-gray-700">{quality.code}</td>
                                                            <td className="py-3 text-gray-600">{quality.name}</td>
                                                            <td className="py-3 text-center">
                                                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">
                                                                    {quality.weight || '0.0'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
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