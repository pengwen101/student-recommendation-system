import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import axios from 'axios';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';
import { NestedDropdown, type DropdownGroup } from '../../../components/NestedDropdown';

export interface StudentMastery {
  curriculum_id: string;
  curriculum_code: string;
  curriculum_name: string;
  mastery_score: number;
  target_score: number;
}

export interface Major {
  major_id: string;
  major_name: string;
  faculty_id: string;
  faculty_name: string;
}

export interface Batch {
  batch_id: string;
}

type BottomChartView = 'quality' | 'indicator';

// --- RADAR CHART COMPONENT ---
function RadarChart({ 
  title, 
  cplName, 
  data, 
  parentCplId, 
  cplScore, 
  onSelect 
}: { 
  title: string; 
  cplName: string;
  data: StudentMastery[];
  parentCplId: string;
  cplScore: number;
  onSelect: (id: string, name: string) => void;
}) {
  
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const maxScore = Math.max(...data.map(d => Math.max(d.mastery_score, d.target_score)), 0);
    const radarMax = maxScore > 0 ? maxScore * 1.2 : 100;

    return {
      tooltip: {
        trigger: 'item',
        extraCssText: 'white-space: normal; max-width: 450px; width: max-content;', 
        
        // --- NEW: Tooltip Positioning Logic ---
        position: (point: number[], params: any, dom: HTMLElement, rect: any, size: any) => {
          // point[0] is X, point[1] is Y
          // size.contentSize is [width, height] of the tooltip popup
          // size.viewSize is [width, height] of the chart container

          // 1. Move it to the left of the cursor (15px gap)
          let xPos = point[0] - size.contentSize[0] - 15;
  
          // 2. Center it vertically (Math is exact: cursor Y minus half the tooltip's height)
          let yPos = point[1] - (size.contentSize[1] / 2);

          // 3. Boundary Fallbacks: Prevent clipping off the screen
          if (xPos < 0) {
            // If it hits the left wall, flip it to the right side of the cursor so it doesn't get cut off
            xPos = point[0] + 15; 
          }
          
          if (yPos < 0) {
            // If it hits the top ceiling, stick it to the top
            yPos = 0; 
          } else if (yPos + size.contentSize[1] > size.viewSize[1]) {
            // If it hits the bottom floor, stick it to the bottom
            yPos = size.viewSize[1] - size.contentSize[1];
          }

          return [xPos, yPos];
        },
        // --------------------------------------

        formatter: (params: any) => {
          const isTarget = params.name === 'Target Score';
          let html = `<div class="text-sm font-semibold border-b border-gray-300 pb-1 mb-1">${title} - ${params.name}</div>`;
          
          data.forEach((item) => {
            const mastery = item.mastery_score || 0;
            const target = item.target_score || 0;
            const isDeficient = mastery < target;
            
            const scoreColor = (!isTarget && isDeficient) ? '#f97316' : (isTarget ? '#6b7280' : '#2563eb');
            const displayValue = isTarget ? target.toFixed(2) : mastery.toFixed(2);

            html += `
              <div class="mt-2 text-xs">
                <div class="font-bold text-gray-700">${item.curriculum_code}</div>
                <div class="text-gray-500 whitespace-normal break-words mt-0.5 leading-snug">${item.curriculum_name}</div>
                <div class="flex justify-between gap-4 mt-1">
                  <span>Score:</span>
                  <span class="font-bold" style="color: ${scoreColor}">${displayValue}</span>
                </div>
              </div>`;
          });
          return html;
        }
      },
      radar: {
        indicator: data.map(d => ({ name: d.curriculum_code, max: radarMax })),
        radius: '60%',
        splitArea: { show: false },
        splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
        axisName: {
          color: '#4b5563',
          fontSize: 11,
          fontWeight: 'bold',
          cursor: 'pointer',
        },
        triggerEvent: true 
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: data.map(d => d.target_score),
              name: 'Target Score',
              areaStyle: { color: 'transparent' },
              lineStyle: { color: '#9ca3af', type: 'dashed', width: 2 },
              itemStyle: { color: '#9ca3af' }
            },
            {
              value: data.map(d => d.mastery_score),
              name: 'Mastery Score',
              areaStyle: { color: 'rgba(59, 130, 246, 0.2)' },
              lineStyle: { color: '#3b82f6', width: 2 },
              itemStyle: { color: '#2563eb' }
            }
          ]
        }
      ]
    };
  }, [data, title]);

  const onEvents = useMemo(() => ({
    click: (params: any) => {
      if (params.componentType === 'radar' && params.name) {
        const clickedItem = data.find(d => d.curriculum_code === params.name);
        if (clickedItem) onSelect(clickedItem.curriculum_id, clickedItem.curriculum_code);
      } 
      else if (params.componentType === 'series' && parentCplId) {
        onSelect(parentCplId, title); 
      }
    }
  }), [data, parentCplId, onSelect, title]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-between min-h-[350px]">
      <div className="w-full px-2 mb-2">
        <div className="flex justify-between items-center mb-1.5">
          <h3 className="font-bold text-gray-800 text-lg leading-tight">{title}</h3>
          <span className="text-xs text-gray-400 italic shrink-0">Click chart or labels to filter</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed w-full">{cplName}</p>
      </div>
      
      {data.length > 0 ? (
        <ReactECharts option={option} onEvents={onEvents} style={{ height: '260px', width: '100%' }} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic text-sm">No data available</div>
      )}

      <div className="mt-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm w-full text-center font-medium border border-blue-100">
        Overall CPL Mastery: <span className="font-bold">{cplScore.toFixed(2)}</span>
      </div>
    </div>
  );
}

// --- VERTICAL BAR CHART COMPONENT ---
function MasteryBarChart({ data, viewName }: { data: StudentMastery[], viewName: string }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const sortedData = [...data].sort((a, b) => b.mastery_score - a.mastery_score);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0].data;
          const isDeficient = item.mastery_score < item.target_score;
          const scoreColor = isDeficient ? '#f97316' : '#2563eb';

          return `
            <div class="text-sm">
              <div class="font-bold border-b border-gray-300 pb-1 mb-1 whitespace-normal max-w-xs break-words">
                ${item.curriculum_name} (${item.curriculum_code})
              </div>
              <div class="mt-1">
                Mastery Score: <span class="font-bold" style="color: ${scoreColor}">${item.mastery_score.toFixed(2)}</span>
              </div>
              <div>
                Target Score: <span class="font-semibold text-gray-500">${item.target_score.toFixed(2)}</span>
              </div>
            </div>
          `;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      dataset: { source: sortedData },
      xAxis: {
        type: 'category',
        axisLabel: { interval: 0, rotate: 30, hideOverlap: true, color: '#6b7280', fontSize: 11 },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
      },
      series: [
        {
          name: 'Mastery',
          type: 'bar',
          barWidth: '40%',
          encode: { x: 'curriculum_code', y: 'mastery_score' },
          itemStyle: {
            // Color individual bars orange if they miss the target
            color: (params: any) => {
              return params.data.mastery_score < params.data.target_score ? '#fb923c' : '#3b82f6';
            },
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 capitalize">{viewName} Mastery Distribution</h3>
      </div>
      {data.length > 0 ? (
        <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
          No data available for current selection.
        </div>
      )}
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function StudentPerformanceDashboard() {
  const [nrpInput, setNrpInput] = useState<string>("");
  const [debouncedNrp, setDebouncedNrp] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string[]>([]);
  
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);

  const [cplData, setCplData] = useState<StudentMastery[]>([]);
  const [subCplData, setSubCplData] = useState<StudentMastery[]>([]);
  const [bottomChartData, setBottomChartData] = useState<StudentMastery[]>([]);
  
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingBottom, setLoadingBottom] = useState(false);
  
  const [bottomView, setBottomView] = useState<BottomChartView>('quality');
  
  // Drill-down states
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);
  const [activeCurriculumName, setActiveCurriculumName] = useState<string | null>(null);

  // Debounce NRP Input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNrp(nrpInput), 600);
    return () => clearTimeout(timer);
  }, [nrpInput]);

  // Fetch Majors & Batches
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [majorsRes, batchesRes] = await Promise.all([
          api.get("/demography/major"),
          api.get("/demography/batch") // Assuming you have a batch endpoint
        ]);
        
        const majorsList = Array.isArray(majorsRes.data) ? majorsRes.data : majorsRes.data.majors;
        const batchesList = Array.isArray(batchesRes.data) ? batchesRes.data : batchesRes.data.batches;
        
        setAllMajors(majorsList || []);
        setAllBatches(batchesList || []);
        
        setSelectedMajor((majorsList || []).map((m: Major) => m.major_id));
        setSelectedBatch((batchesList || []).map((b: Batch) => b.batch_id));
      } catch {
        toast.error("Failed to load filters");
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Radars
  useEffect(() => {
    const fetchSubCpls = async () => {
      try {
        setLoadingTop(true);
        const params = new URLSearchParams();
        if (debouncedNrp) params.append("nrp", debouncedNrp);
        selectedBatch.forEach(l => params.append("batch_ids", l));
        selectedMajor.forEach(m => params.append("major_ids", m));

        const [cplRes, subCplRes] = await Promise.all([
          api.get('/analytic/student_mastery/cpl', { params }),
          api.get('/analytic/student_mastery/sub_cpl', { params })
        ]);

        const sortedCpls = cplRes.data.sort((a: StudentMastery, b: StudentMastery) => 
          a.curriculum_code.localeCompare(b.curriculum_code)
        );

        setCplData(sortedCpls);
        setSubCplData(subCplRes.data);
      } catch {
        toast.error("Failed to load Sub-CPL data");
      } finally {
        setLoadingTop(false);
      }
    };

    if (selectedMajor.length > 0) fetchSubCpls();
  }, [debouncedNrp, selectedBatch, selectedMajor]);

  // Fetch Bottom Chart
  useEffect(() => {
    const controller = new AbortController();
    const fetchBottomChart = async () => {
      try {
        setLoadingBottom(true);
        const params = new URLSearchParams();
        if (debouncedNrp) params.append("nrp", debouncedNrp);
        selectedBatch.forEach(l => params.append("batch_ids", l));
        selectedMajor.forEach(m => params.append("major_ids", m));
        
        // 4. Pass the clicked ID to the backend filter
        if (activeCurriculumId) params.append("curriculum_id", activeCurriculumId);

        const res = await api.get(`/analytic/student_mastery/${bottomView}`, { 
          params,
          signal: controller.signal 
        });
        setBottomChartData(res.data);
      } catch {
        if (axios.isCancel(error)) {
          console.log("Stale request cancelled");
        } else {
          toast.error(`Failed to load data`);
        }
      } finally {
        setLoadingBottom(false);
      }
    };

    fetchBottomChart();
    return () => {
      controller.abort();
    };
  }, [debouncedNrp, selectedBatch, selectedMajor, bottomView, activeCurriculumId]);


  // Handle Drill Down Click
  const handleRadarSelect = (id: string, name: string) => {
    setActiveCurriculumId(id);
    setActiveCurriculumName(name);
    toast.success(`Filtering by ${name}`);
  };

  const clearFilter = () => {
    setActiveCurriculumId(null);
    setActiveCurriculumName(null);
  };

  const groupedMajors: DropdownGroup[] = useMemo(() => {
    const groups: Record<string, DropdownGroup> = {};
    allMajors.forEach(m => {
      if (!groups[m.faculty_id]) {
        groups[m.faculty_id] = { 
          groupId: m.faculty_id, 
          groupLabel: m.faculty_name, 
          options: [] 
        };
      }
      groups[m.faculty_id].options.push({
        id: m.major_id,
        label: m.major_name
      });
    });
    return Object.values(groups);
  }, [allMajors]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Skor CPL Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Klik sebuah Sub-CPL untuk filter grafik kualitas/indikator di bawah.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label htmlFor="nrp_input" className="text-sm font-semibold text-gray-700">Search NRP</label>
          <input
            id="nrp_input"
            type="text"
            placeholder="Enter Student NRP..."
            value={nrpInput}
            onChange={(e) => setNrpInput(e.target.value)}
            className="w-full h-[38px] px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        
        <DropdownFilter 
          title="Batch"
          options={allBatches.map(b => ({ label: b.batch_id, value: b.batch_id }))}
          selectedValues={selectedBatch}
          onChange={setSelectedBatch}
          multiSelect={true}
        />

        <NestedDropdown 
            title="Faculty & Major"
            groups={groupedMajors}
            selectedValues={selectedMajor}
            onChange={setSelectedMajor}
        />
      </div>

      <div className="relative mb-8">
        {loadingTop && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Updating Radars...</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cplData.map((cpl) => {
            // Group Sub-CPLs by checking if their code starts with this CPL's code
            const relatedSubCpls = subCplData.filter(sub => 
              sub.curriculum_code.startsWith(cpl.curriculum_code)
            );

            return (
              <RadarChart 
                key={cpl.curriculum_id}
                title={cpl.curriculum_code} 
                cplName={cpl.curriculum_name}
                data={relatedSubCpls} 
                parentCplId={cpl.curriculum_id} // <--- Real UUID from the API!
                cplScore={cpl.mastery_score}    // <--- Real Mastery Score from the API!
                onSelect={handleRadarSelect} 
              />
            );
          })}
          
          {/* Fallback if no data */}
          {!loadingTop && cplData.length === 0 && (
             <div className="col-span-3 text-center py-10 text-gray-500 italic bg-white rounded-xl border border-gray-100 shadow-sm">
               No CPL data found for this selection.
             </div>
          )}
        </div>
      </div>

      <div className="relative">
        {loadingBottom && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Updating Chart...</div>}
        
        <div className="flex justify-between items-end mb-3">
          <div>
            {activeCurriculumId && (
              <button onClick={clearFilter} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded transition-colors mb-2">
                Clear Filter: {activeCurriculumName} ×
              </button>
            )}
          </div>
          <div className="flex bg-white shadow-sm border border-gray-200 p-1 rounded-lg">
            {(['quality', 'indicator'] as BottomChartView[]).map((view) => (
              <button
                key={view}
                onClick={() => setBottomView(view)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ease-in-out ${
                  bottomView === view ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {view.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <MasteryBarChart data={bottomChartData} viewName={bottomView} />
      </div>
      
    </div>
  );
}