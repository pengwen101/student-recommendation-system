import { Panel, Group, Separator } from "react-resizable-panels";
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios.tsx';
import type { CPL, SubCpl } from '../../types.ts';

function getVal(dirty: Record<string, any>, type: string, id: string, field: string) {
  return dirty[`${type}:${id}`]?.[field];
}

function hasDirty(dirty: Record<string, any>, key: string) {
  return dirty[key] !== undefined;
}

function Curriculum() {
    const [curriculum, setCurriculum] = useState<CPL[]>([]);
    const [versionId, setVersionId] = useState<string>("1");
    const [loading, setLoading] = useState<boolean>(true);

    const [expandedCplId, setExpandedCplId] = useState<string | null>(null);
    const [selectedSubCpl, setSelectedSubCpl] = useState<SubCpl | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [dirtyChanges, setDirtyChanges] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    const [versions, setVersions] = useState<{ curriculum_version_id: number }[]>([]);
    const [batches, setBatches] = useState<{ batch_id: string }[]>([]);
    const [suggestedNext, setSuggestedNext] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [importing, setImporting] = useState(false);

    const [newParentSubCpl, setNewParentSubCpl] = useState<Record<string, string>>({});
    const [newParentWeight, setNewParentWeight] = useState<Record<string, string>>({});
    const [batchInfo, setBatchInfo] = useState<{ batch_id: string; student_count: number }[]>([]);

    const handleDownloadTemplate = async () => {
      try {
        const response = await api.get('/curriculum/template', { responseType: 'blob' });
        const url = URL.createObjectURL(response.data as Blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'template_curriculum.xlsx';
        a.click(); URL.revokeObjectURL(url);
      } catch {
        toast.error("Failed to download template.");
      }
    };

    const handleImport = async () => {
      if (!importFile || !selectedBatch) return;
      setImporting(true);
      try {
        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('batch_id', selectedBatch);
        await api.post('/curriculum', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const versionsRes = await api.get('/curriculum_version');
        const vList = versionsRes.data.curriculum_versions || [];
        setVersions(vList);
        const maxV = vList.reduce((m: number, v: { curriculum_version_id: number }) => Math.max(m, v.curriculum_version_id), 0);
        const newV = String(maxV);
        setVersionId(newV);
        const currRes = await api.get(`/curriculum/${newV}`);
        setCurriculum(currRes.data.curriculum);
        setShowImportModal(false);
        setImportFile(null);
        setSelectedBatch('');
        toast.success(`Curriculum version ${newV} created successfully.`);
      } catch {
        toast.error("Failed to import curriculum.");
      } finally {
        setImporting(false);
      }
    };

    const mark = (type: string, id: string, field: string, value: any) => {
      setDirtyChanges(prev => ({ ...prev, [`${type}:${id}`]: { ...prev[`${type}:${id}`], id, [field]: value } }));
    };

    const allCpls = useMemo(() => curriculum.map(c => ({ id: c.cpl_id, code: c.code, name: c.name })), [curriculum]);
    const allSubCpls = useMemo(() => curriculum.flatMap(c => (c.subcpls || []).map(s => ({ id: s.sub_cpl_id, code: s.code, name: s.name, cplId: c.cpl_id }))), [curriculum]);
    const allQualities = useMemo(() => curriculum.flatMap(c => (c.subcpls || []).flatMap(s => (s.qualities || []).map(q => ({ id: q.quality_id, code: q.code, name: q.name, subCplId: s.sub_cpl_id })))), [curriculum]);
    const allIndicators = useMemo(() => curriculum.flatMap(c => (c.subcpls || []).flatMap(s => (s.qualities || []).flatMap(q => (q.indicators || []).map(i => ({ id: i.indicator_id, code: i.code, name: i.name, qualityId: q.quality_id }))))), [curriculum]);

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

    useEffect(() => {
        api.get('/curriculum_version').then(r => setVersions(r.data.curriculum_versions || [])).catch(() => {});
        api.get('/demography/batch/available').then(r => {
          const data = r.data;
          const list: string[] = data.available || [];
          const next: string | null = data.suggested_next || null;
          setSuggestedNext(next);
          if (next && !list.includes(next)) list.push(next);
          setBatches(list.map((b: string) => ({ batch_id: b })));
        }).catch(() => {});
    }, []);

    useEffect(() => {
        api.get(`/curriculum/${versionId}/batch-info`).then(r => setBatchInfo(r.data.batch_info || [])).catch(() => setBatchInfo([]));
    }, [versionId]);

    const findSubCplCplId = (subCplId: string) => {
      for (const c of curriculum) if (c.subcpls?.some(s => s.sub_cpl_id === subCplId)) return c.cpl_id;
      return '';
    };

    const findQualityParents = (qualityId: string) => {
      const parents: { sub_cpl_id: string; code: string; name: string; weight: number }[] = [];
      for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) if (q.quality_id === qualityId) parents.push({ sub_cpl_id: s.sub_cpl_id, code: s.code, name: s.name, weight: q.weight });
      return parents;
    };

    const getQualityParents = (qualityId: string) => {
      const dirty = getVal(dirtyChanges, 'quality', qualityId, 'subcpls');
      if (dirty !== undefined) {
        const list = dirty as { sub_cpl_id: string; weight: number }[];
        return list.map(p => { const sc = allSubCpls.find(s => s.id === p.sub_cpl_id); return { sub_cpl_id: p.sub_cpl_id, code: sc?.code ?? '', name: sc?.name ?? '', weight: p.weight }; });
      }
      return findQualityParents(qualityId);
    };

    const findIndicatorQualityId = (indicatorId: string, fallback: string) => {
      for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) if (q.indicators?.some(i => i.indicator_id === indicatorId)) return q.quality_id;
      return fallback;
    };

    const findQuestionIndicatorId = (questionId: string, fallback: string) => {
      for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) for (const i of q.indicators || []) if (i.questions?.some(qs => qs.question_id === questionId)) return i.indicator_id;
      return fallback;
    };

    const origCpl = (id: string) => curriculum.find(c => c.cpl_id === id);
    const origSubCpl = (id: string) => { for (const c of curriculum) for (const s of c.subcpls || []) if (s.sub_cpl_id === id) return s; return undefined; };
    const origQuality = (id: string) => { for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) if (q.quality_id === id) return q; return undefined; };
    const origIndicator = (id: string) => { for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) for (const i of q.indicators || []) if (i.indicator_id === id) return i; return undefined; };
    const origQuestion = (id: string) => { for (const c of curriculum) for (const s of c.subcpls || []) for (const q of s.qualities || []) for (const i of q.indicators || []) for (const qs of i.questions || []) if (qs.question_id === id) return qs; return undefined; };

    const handleSaveAll = async () => {
      setSaving(true);
      let needsRecalc = false;
      for (const [key, data] of Object.entries(dirtyChanges)) {
        const type = key.split(':')[0];
        if (type === 'subcpl' && data.cpl_id !== undefined && data.cpl_id !== findSubCplCplId(data.id))
          needsRecalc = true;
        if (type === 'quality') {
          const dirtySubcpls = getVal(dirtyChanges, 'quality', data.id, 'subcpls');
          if (dirtySubcpls !== undefined) {
            const origParents = findQualityParents(data.id);
            const newMap = dirtySubcpls.map((p: any) => `${p.sub_cpl_id}:${p.weight}`).sort().join(',');
            const origMap = origParents.map(p => `${p.sub_cpl_id}:${p.weight}`).sort().join(',');
            if (newMap !== origMap) needsRecalc = true;
          }
        }
        if (type === 'indicator' && data.quality_id !== undefined && data.quality_id !== findIndicatorQualityId(data.id, ''))
          needsRecalc = true;
      }
      try {
        const order = ['cpl', 'subcpl', 'quality', 'indicator', 'question'];
        for (const type of order) {
          const prefix = `${type}:`;
          const items = Object.entries(dirtyChanges).filter(([k]) => k.startsWith(prefix));
          for (const [, data] of items) {
            if (type === 'cpl') { const o = origCpl(data.id); await api.put(`/cpl/${data.id}`, { code: data.code ?? o?.code, name: data.name ?? o?.name, curriculum_version_id: versionId }); }
            else if (type === 'subcpl') { const o = origSubCpl(data.id); await api.put(`/subcpl/${data.id}`, { code: data.code ?? o?.code, name: data.name ?? o?.name, cpl_id: data.cpl_id ?? findSubCplCplId(data.id) }); }
            else if (type === 'quality') { const o = origQuality(data.id); await api.put(`/quality/${data.id}`, { code: data.code ?? o?.code, name: data.name ?? o?.name, subcpls: (data.subcpls !== undefined ? (data.subcpls as { sub_cpl_id: string; weight: number }[]) : findQualityParents(data.id).map(p => ({ sub_cpl_id: p.sub_cpl_id, weight: p.weight }))).map(p => ({ sub_cpl_id: p.sub_cpl_id, weight: p.weight })) }); }
            else if (type === 'indicator') { const o = origIndicator(data.id); await api.put(`/indicator/${data.id}`, { code: data.code ?? o?.code, name: data.name ?? o?.name, qualities: [{ quality_id: data.quality_id ?? findIndicatorQualityId(data.id, '') }] }); }
            else if (type === 'question') { const o = origQuestion(data.id); await api.put(`/question/${data.id}`, { code: data.code ?? o?.code, name: data.name ?? o?.name, lower_bound: data.lower_bound ?? o?.lower_bound, upper_bound: data.upper_bound ?? o?.upper_bound, lower_text: data.lower_text ?? o?.lower_text ?? '', upper_text: data.upper_text ?? o?.upper_text ?? '', flipped: data.flipped ?? o?.flipped ?? false, indicator_id: data.indicator_id ?? findQuestionIndicatorId(data.id, '') }); }
          }
        }
        const result = await api.get(`/curriculum/${versionId}`);
        setCurriculum(result.data.curriculum);
        if (selectedSubCpl) {
          for (const c of result.data.curriculum || []) {
            for (const s of c.subcpls || []) {
              if (s.sub_cpl_id === selectedSubCpl.sub_cpl_id) {
                setSelectedSubCpl(s);
                break;
              }
            }
          }
        }
        setIsEditing(false);
        setDirtyChanges({});
        toast.success(needsRecalc ? "Curriculum updated. Student scores recalculated." : "Curriculum updated.");
      } catch {
        toast.error("Failed to save changes.");
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => { setIsEditing(false); setDirtyChanges({}); };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading curriculum...</div>;

    return (
        <div className="h-screen bg-gray-50 flex flex-col relative font-sans">
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4 z-10 shadow-sm">
                <label className="font-semibold text-gray-700">Curriculum Version:</label>
                <select value={versionId} onChange={e => setVersionId(e.target.value)} className="border border-gray-300 p-2 rounded text-gray-700 bg-white outline-none focus:border-blue-500 font-medium">
                    {versions.map(v => <option key={v.curriculum_version_id} value={String(v.curriculum_version_id)}>{v.curriculum_version_id}</option>)}
                </select>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {batchInfo.length > 0 ? batchInfo.map(b => (
                    <span key={b.batch_id} className="bg-slate-100 px-2.5 py-1 rounded-full font-medium">{b.batch_id}<span className="text-slate-400 ml-1 font-normal">· {b.student_count} student{b.student_count !== 1 ? 's' : ''}</span></span>
                  )) : <span className="text-slate-400 italic">No batch linked</span>}
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors">Create Curriculum</button>
                      <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">Import Curriculum</button>
                      <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Edit Mode</button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleCancel} disabled={saving} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                      <button onClick={handleSaveAll} disabled={saving || Object.keys(dirtyChanges).length === 0} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                        {saving ? 'Saving...' : `Save All (${Object.keys(dirtyChanges).length})`}
                      </button>
                    </>
                  )}
                </div>
            </div>

            {showImportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { if (!importing) { setShowImportModal(false); setImportFile(null); setSelectedBatch(''); } }}>
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-slate-800">Import Curriculum</h3>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">File (.xlsx)</label>
                    <input type="file" accept=".xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch</label>
                    <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-slate-700">
                      <option value="">-- Select Batch --</option>
                      {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.batch_id}{b.batch_id === suggestedNext ? ' (new)' : ''}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { if (!importing) { setShowImportModal(false); setImportFile(null); setSelectedBatch(''); } }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={handleImport} disabled={!importFile || !selectedBatch || importing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                      {importing ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 relative">
                <Group orientation="horizontal" className="h-full">

                    {/* LEFT PANE */}
                    <Panel defaultSize={30} minSize={20}>
                        <div className="h-full overflow-y-auto bg-white flex flex-col">
                            <div className="p-4 border-b bg-slate-50 font-bold text-slate-800">Curriculum Structure</div>
                            <div className="flex-1 p-4 space-y-3">
                                {curriculum?.map((cpl) => (
                                    <div key={cpl.cpl_id} className={`border rounded-lg shadow-sm overflow-hidden ${isEditing && hasDirty(dirtyChanges, `cpl:${cpl.cpl_id}`) ? 'border-amber-400' : 'border-slate-200'}`}>
                                        {isEditing ? (
                                          <div className="flex gap-2 p-2 bg-amber-50">
                                            <input value={getVal(dirtyChanges, 'cpl', cpl.cpl_id, 'code') ?? cpl.code} onChange={e => mark('cpl', cpl.cpl_id, 'code', e.target.value)} className="w-24 px-2 py-1 border border-amber-300 rounded text-sm font-bold text-slate-700 bg-white" />
                                            <input value={getVal(dirtyChanges, 'cpl', cpl.cpl_id, 'name') ?? cpl.name} onChange={e => mark('cpl', cpl.cpl_id, 'name', e.target.value)} className="flex-1 px-2 py-1 border border-amber-300 rounded text-sm text-slate-700 bg-white" />
                                            <span className="text-xs text-amber-600 font-semibold self-center">CPL</span>
                                          </div>
                                        ) : (
                                          <button onClick={() => setExpandedCplId(expandedCplId === cpl.cpl_id ? null : cpl.cpl_id)} className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex justify-between items-center transition-colors">
                                            <span className="pr-2">{cpl.code} | {cpl.name}</span>
                                            <span className="text-xs text-slate-400 shrink-0">{expandedCplId === cpl.cpl_id ? '▼' : '▶'}</span>
                                          </button>
                                        )}

                                        {expandedCplId === cpl.cpl_id && (
                                            <div className="bg-white p-2 space-y-1 border-t border-slate-100">
                                                {(!cpl.subcpls || cpl.subcpls.length === 0) && (
                                                    <p className="text-sm text-slate-400 p-2 italic">No Sub-CPLs found.</p>
                                                )}
                                                {cpl.subcpls?.map((subcpl) => {
                                                    const isSelected = selectedSubCpl?.sub_cpl_id === subcpl.sub_cpl_id;
                                                    const dirty = hasDirty(dirtyChanges, `subcpl:${subcpl.sub_cpl_id}`);
                                                    return isEditing ? (
                                                      <div key={subcpl.sub_cpl_id} className={`flex gap-1.5 p-1.5 rounded transition-colors ${dirty ? 'bg-amber-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}>
                                                        <input value={getVal(dirtyChanges, 'subcpl', subcpl.sub_cpl_id, 'code') ?? subcpl.code} onChange={e => { mark('subcpl', subcpl.sub_cpl_id, 'code', e.target.value); setSelectedSubCpl(subcpl); }} className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs font-semibold text-slate-700 bg-white" />
                                                        <input value={getVal(dirtyChanges, 'subcpl', subcpl.sub_cpl_id, 'name') ?? subcpl.name} onChange={e => { mark('subcpl', subcpl.sub_cpl_id, 'name', e.target.value); setSelectedSubCpl(subcpl); }} className="flex-1 px-1 py-0.5 border border-amber-300 rounded text-xs text-slate-700 bg-white" />
                                                      </div>
                                                    ) : (
                                                      <button key={subcpl.sub_cpl_id} onClick={() => setSelectedSubCpl(subcpl)} className={`w-full text-left text-sm p-2.5 rounded transition-colors ${isSelected ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}>
                                                        • {subcpl.code} | {subcpl.name}
                                                      </button>
                                                    );
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
                                    <p className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">Select a Sub-CPL from the left to view its mapped structure.</p>
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="border-b border-slate-200 pb-4 mb-8">
                                        {isEditing ? (
                                          <div className="space-y-3">
                                            <div className="flex gap-2">
                                              <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code</label>
                                                <input value={getVal(dirtyChanges, 'subcpl', selectedSubCpl.sub_cpl_id, 'code') ?? selectedSubCpl.code} onChange={e => mark('subcpl', selectedSubCpl.sub_cpl_id, 'code', e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-2xl font-extrabold text-slate-800 bg-amber-50" />
                                              </div>
                                              <div className="flex-[2] space-y-1">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                                <input value={getVal(dirtyChanges, 'subcpl', selectedSubCpl.sub_cpl_id, 'name') ?? selectedSubCpl.name} onChange={e => mark('subcpl', selectedSubCpl.sub_cpl_id, 'name', e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg text-slate-600 bg-amber-50" />
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent CPL</label>
                                              <select value={getVal(dirtyChanges, 'subcpl', selectedSubCpl.sub_cpl_id, 'cpl_id') ?? findSubCplCplId(selectedSubCpl.sub_cpl_id)} onChange={e => mark('subcpl', selectedSubCpl.sub_cpl_id, 'cpl_id', e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50 text-slate-700">
                                                {allCpls.map(c => <option key={c.id} value={c.id}>{c.code} | {c.name}</option>)}
                                              </select>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{selectedSubCpl.code} Mapping Details</h2>
                                            <p className="text-slate-500 mt-1">{selectedSubCpl.name}</p>
                                          </>
                                        )}
                                    </div>

                                    {(!selectedSubCpl.qualities || selectedSubCpl.qualities.length === 0) ? (
                                        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 italic">No qualities mapped to this Sub-CPL yet.</div>
                                    ) : (
                                        <div className="space-y-8">
                                            {selectedSubCpl.qualities.map((quality) => (
                                                <div key={quality.quality_id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${isEditing && hasDirty(dirtyChanges, `quality:${quality.quality_id}`) ? 'border-amber-400' : 'border-slate-200'}`}>

                                                    <div className={`p-4 border-b border-slate-200 ${isEditing ? 'bg-amber-50' : 'bg-slate-100/50'}`}>
                                                        {isEditing ? (
                                                          <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                              <div className="space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code</label>
                                                                <input value={getVal(dirtyChanges, 'quality', quality.quality_id, 'code') ?? quality.code} onChange={e => mark('quality', quality.quality_id, 'code', e.target.value)} className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm font-bold text-slate-800 bg-white" />
                                                              </div>
                                                              <div className="flex-[2] space-y-1">
                                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                                                <input value={getVal(dirtyChanges, 'quality', quality.quality_id, 'name') ?? quality.name} onChange={e => mark('quality', quality.quality_id, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm text-slate-800 bg-white" />
                                                              </div>
                                                            </div>
                                                             <div className="space-y-2">
                                                               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent SubCPLs</label>
                                                               {getQualityParents(quality.quality_id).map(p => (
                                                                   <div key={p.sub_cpl_id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-white px-3 py-1.5 rounded border border-amber-200">
                                                                     <span className="text-sm font-medium text-slate-700 truncate">{p.code} | {p.name}</span>
                                                                     <div className="flex items-center gap-1">
                                                                     <label className="text-xs text-slate-400">Weight:</label>
                                                                     <input type="number" step="0.01" value={p.weight}
                                                                       onChange={e => {
                                                                         const list = getQualityParents(quality.quality_id).map(p2 =>
                                                                           p2.sub_cpl_id === p.sub_cpl_id ? { ...p2, weight: parseFloat(e.target.value) || 0 } : p2
                                                                         );
                                                                         mark('quality', quality.quality_id, 'subcpls', list.map(p2 => ({ sub_cpl_id: p2.sub_cpl_id, weight: p2.weight })));
                                                                       }}
                                                                       className="w-20 px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
                                                                   </div>
                                                                    <button onClick={() => {
                                                                      const list = getQualityParents(quality.quality_id).filter(p2 => p2.sub_cpl_id !== p.sub_cpl_id);
                                                                      mark('quality', quality.quality_id, 'subcpls', list.map(p2 => ({ sub_cpl_id: p2.sub_cpl_id, weight: p2.weight })));
                                                                     }} className="text-red-500 hover:text-red-700 text-sm font-bold px-2" title="Remove parent">✕</button>
                                                                 </div>
                                                               ))}
                                                               <div className="flex items-center gap-2 pt-1 border-t border-dashed border-slate-300">
                                                                 <select value={newParentSubCpl[quality.quality_id] ?? ''} onChange={e => setNewParentSubCpl(prev => ({ ...prev, [quality.quality_id]: e.target.value }))} className="flex-1 px-2 py-1.5 border border-amber-300 rounded text-sm bg-white text-slate-700">
                                                                   <option value="">+ Add SubCPL...</option>
                                                                   {allSubCpls.filter(sc => !getQualityParents(quality.quality_id).some(p => p.sub_cpl_id === sc.id)).map(sc => (
                                                                     <option key={sc.id} value={sc.id}>{sc.code} | {sc.name}</option>
                                                                   ))}
                                                                 </select>
                                                                 <input type="number" step="0.01" value={newParentWeight[quality.quality_id] ?? '1.0'} onChange={e => setNewParentWeight(prev => ({ ...prev, [quality.quality_id]: e.target.value }))} className="w-20 px-2 py-1.5 border border-amber-300 rounded text-sm bg-white" placeholder="W" />
                                                                 <button onClick={() => {
                                                                   const qId = quality.quality_id;
                                                                   const scId = newParentSubCpl[qId];
                                                                   if (!scId) return;
                                                                   const w = parseFloat(newParentWeight[qId] ?? '1.0');
                                                                   const current = getQualityParents(qId).map(p2 => ({ sub_cpl_id: p2.sub_cpl_id, weight: p2.weight }));
                                                                   mark('quality', qId, 'subcpls', [...current, { sub_cpl_id: scId, weight: w }]);
                                                                   setNewParentSubCpl(prev => ({ ...prev, [qId]: '' }));
                                                                   setNewParentWeight(prev => ({ ...prev, [qId]: '1.0' }));
                                                                 }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50" disabled={!newParentSubCpl[quality.quality_id]}>Add</button>
                                                               </div>
                                                             </div>
                                                          </div>
                                                        ) : (
                                                          <div className="flex justify-between items-center gap-4">
                                                            <div>
                                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quality</span>
                                                              <h3 className="font-bold text-slate-800 text-lg">{quality.code} | {quality.name}</h3>
                                                            </div>
                                                            <div className="text-xs text-slate-500 text-right max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap" title={findQualityParents(quality.quality_id).map(p => `${p.code} (${p.weight})`).join(', ')}><span className="font-semibold">Parents:</span> {findQualityParents(quality.quality_id).map(p => `${p.code} (${p.weight})`).join(', ') || <span className="italic text-red-400">none</span>}</div>
                                                          </div>
                                                        )}
                                                    </div>

                                                    <div className="p-5 space-y-6">
                                                        {(!quality.indicators || quality.indicators.length === 0) ? (
                                                            <p className="text-slate-400 italic text-sm">No indicators mapped to this quality.</p>
                                                        ) : (
                                                            quality.indicators.map((indicator) => (
                                                                <div key={indicator.indicator_id} className={`bg-slate-50 border rounded-lg p-4 ${isEditing && hasDirty(dirtyChanges, `indicator:${indicator.indicator_id}`) ? 'border-amber-400' : 'border-slate-200'}`}>
                                                                    {isEditing ? (
                                                                      <div className="space-y-2">
                                                                        <div className="flex gap-2">
                                                                          <div className="space-y-1">
                                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Code</label>
                                                                            <input value={getVal(dirtyChanges, 'indicator', indicator.indicator_id, 'code') ?? indicator.code} onChange={e => mark('indicator', indicator.indicator_id, 'code', e.target.value)} className="w-20 px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
                                                                          </div>
                                                                          <div className="flex-1 space-y-1">
                                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                                                            <input value={getVal(dirtyChanges, 'indicator', indicator.indicator_id, 'name') ?? indicator.name} onChange={e => mark('indicator', indicator.indicator_id, 'name', e.target.value)} className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white" />
                                                                          </div>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                          <div className="flex-1 space-y-1">
                                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parent Quality</label>
                                                                            <select value={getVal(dirtyChanges, 'indicator', indicator.indicator_id, 'quality_id') ?? findIndicatorQualityId(indicator.indicator_id, quality.quality_id)} onChange={e => mark('indicator', indicator.indicator_id, 'quality_id', e.target.value)} className="w-full px-2 py-1 border border-amber-300 rounded text-sm bg-white text-slate-700">
                                                                              {allQualities.map(q => <option key={q.id} value={q.id}>{q.code} | {q.name}</option>)}
                                                                            </select>
                                                                          </div>
                                                                        </div>
                                                                      </div>
                                                                    ) : (
                                                                      <div>
                                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Indicator</span>
                                                                        <h4 className="font-semibold text-slate-700">{indicator.code} | {indicator.name}</h4>
                                                                      </div>
                                                                    )}

                                                                    {(!indicator.questions || indicator.questions.length === 0) ? (
                                                                        <p className="text-slate-400 italic text-xs mt-3">No questions mapped to this indicator.</p>
                                                                    ) : (
                                                                        <div className="overflow-x-auto rounded-lg border border-slate-200 mt-4">
                                                                            <table className="w-full text-left bg-white">
                                                                                <thead className="bg-slate-100 text-xs text-slate-600 uppercase tracking-wider">
                                                                                    <tr>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200">Code</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200">Name</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200 text-center">Lower</th>
                                                                                        <th className="p-3 font-semibold border-b border-slate-200 text-center">Upper</th>
                                                                                        {isEditing && <>
                                                                                          <th className="p-3 font-semibold border-b border-slate-200 text-center">Lower Text</th>
                                                                                          <th className="p-3 font-semibold border-b border-slate-200 text-center">Upper Text</th>
                                                                                          <th className="p-3 font-semibold border-b border-slate-200 text-center">Flipped</th>
                                                                                          <th className="p-3 font-semibold border-b border-slate-200 text-center">Parent Indicator</th>
                                                                                        </>}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 text-sm">
                                                                                    {indicator.questions.map((q) => {
                                                                                      const qDirty = hasDirty(dirtyChanges, `question:${q.question_id}`);
                                                                                      return isEditing ? (
                                                                                        <tr key={q.question_id} className={`${qDirty ? 'bg-amber-50' : 'hover:bg-slate-50/50'} transition-colors`}>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'code') ?? q.code} onChange={e => mark('question', q.question_id, 'code', e.target.value)} className="w-16 px-1 py-0.5 border border-amber-300 rounded text-xs bg-white" /></td>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'name') ?? q.name} onChange={e => mark('question', q.question_id, 'name', e.target.value)} className="w-40 px-1 py-0.5 border border-amber-300 rounded text-xs bg-white" /></td>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'lower_bound') ?? q.lower_bound} onChange={e => mark('question', q.question_id, 'lower_bound', e.target.value)} className="w-12 px-1 py-0.5 border border-amber-300 rounded text-xs text-center bg-white" /></td>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'upper_bound') ?? q.upper_bound} onChange={e => mark('question', q.question_id, 'upper_bound', e.target.value)} className="w-12 px-1 py-0.5 border border-amber-300 rounded text-xs text-center bg-white" /></td>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'lower_text') ?? q.lower_text ?? ''} onChange={e => mark('question', q.question_id, 'lower_text', e.target.value)} className="w-24 px-1 py-0.5 border border-amber-300 rounded text-xs bg-white" /></td>
                                                                                          <td className="p-1.5"><input value={getVal(dirtyChanges, 'question', q.question_id, 'upper_text') ?? q.upper_text ?? ''} onChange={e => mark('question', q.question_id, 'upper_text', e.target.value)} className="w-24 px-1 py-0.5 border border-amber-300 rounded text-xs bg-white" /></td>
                                                                                          <td className="p-1.5 text-center"><input type="checkbox" checked={getVal(dirtyChanges, 'question', q.question_id, 'flipped') ?? q.flipped ?? false} onChange={e => mark('question', q.question_id, 'flipped', e.target.checked)} className="w-4 h-4" /></td>
                                                                                          <td className="p-1.5">
                                                                                            <select value={getVal(dirtyChanges, 'question', q.question_id, 'indicator_id') ?? findQuestionIndicatorId(q.question_id, indicator.indicator_id)} onChange={e => mark('question', q.question_id, 'indicator_id', e.target.value)} className="w-28 px-1 py-0.5 border border-amber-300 rounded text-xs bg-white">
                                                                                              {allIndicators.map(ind => <option key={ind.id} value={ind.id}>{ind.code}</option>)}
                                                                                            </select>
                                                                                          </td>
                                                                                        </tr>
                                                                                      ) : (
                                                                                        <tr key={q.question_id} className="hover:bg-slate-50/50 transition-colors">
                                                                                            <td className="p-3 font-medium text-slate-700 whitespace-nowrap">{q.code}</td>
                                                                                            <td className="p-3 text-slate-600">{q.name}</td>
                                                                                            <td className="p-3 text-center"><span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-xs font-bold" title={q.lower_text}>{q.lower_bound}</span></td>
                                                                                            <td className="p-3 text-center"><span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-xs font-bold" title={q.upper_text}>{q.upper_bound}</span></td>
                                                                                        </tr>
                                                                                      );
                                                                                    })}
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
