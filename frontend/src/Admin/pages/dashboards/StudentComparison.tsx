import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import axios from 'axios';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';
import { NestedDropdown, type DropdownGroup } from '../../../components/NestedDropdown';

// --- Types ---
export interface StudentComparisonRaw {
  follow_rec: boolean;
  code: string;
  name: string;
  avg_score: number;
}

export interface ProcessedComparison {
  code: string;
  name: string;
  followedScore: number;
  ignoredScore: number;
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

// --- DATA PROCESSING HELPER ---
// Merges the flat true/false rows into a single object per curriculum code
function processComparisonData(rawData: StudentComparisonRaw[]): ProcessedComparison[] {
  const map = new Map<string, ProcessedComparison>();
  
  rawData.forEach(item => {
    if (!map.has(item.code)) {
      map.set(item.code, { code: item.code, name: item.name, followedScore: 0, ignoredScore: 0 });
    }
    const entry = map.get(item.code)!;
    if (item.follow_rec) {
      entry.followedScore = item.avg_score;
    } else {
      entry.ignoredScore = item.avg_score;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
}


// --- RADAR CHART COMPONENT (TOP) ---
function ComparisonRadarChart({ 
  title, 
  data, 
  cplData 
}: { 
  title: string; 
  data: ProcessedComparison[];
  cplData?: ProcessedComparison;
}) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const maxScore = Math.max(...data.map(d => Math.max(d.followedScore, d.ignoredScore)), 0);
    const radarMax = maxScore > 0 ? maxScore * 1.2 : 100;

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const isFollowed = params.name === 'Followed Recs';
          const color = isFollowed ? '#10b981' : '#f43f5e';
          
          let html = `<div class="text-sm font-semibold border-b border-gray-300 pb-1 mb-1">${title} - ${params.name}</div>`;
          
          data.forEach((item) => {
            const score = isFollowed ? item.followedScore : item.ignoredScore;
            html += `
              <div class="mt-2 text-xs">
                <div class="font-bold text-gray-700">${item.code}</div>
                <div class="text-gray-500 truncate max-w-[200px]" title="${item.name}">${item.name}</div>
                <div class="flex justify-between gap-4 mt-0.5">
                  <span>Score:</span>
                  <span class="font-bold" style="color: ${color}">${score.toFixed(2)}</span>
                </div>
              </div>`;
          });
          return html;
        }
      },
      legend: {
        data: ['Followed Recs', 'Ignored Recs'],
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 11, fontWeight: 'bold' }
      },
      radar: {
        indicator: data.map(d => ({ name: d.code, max: radarMax })),
        radius: '55%',
        center: ['50%', '45%'],
        splitArea: { show: false },
        splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
        axisName: { color: '#4b5563', fontSize: 11, fontWeight: 'bold' }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: data.map(d => d.followedScore),
              name: 'Followed Recs',
              areaStyle: { color: 'rgba(16, 185, 129, 0.2)' },
              lineStyle: { color: '#10b981', width: 2 },
              itemStyle: { color: '#059669' }
            },
            {
              value: data.map(d => d.ignoredScore),
              name: 'Ignored Recs',
              areaStyle: { color: 'rgba(244, 63, 94, 0.2)' },
              lineStyle: { color: '#f43f5e', width: 2 },
              itemStyle: { color: '#e11d48' }
            }
          ]
        }
      ]
    };
  }, [data, title]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-between min-h-[380px]">
      <div className="w-full text-center px-2 mb-2">
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      
      {data.length > 0 ? (
        <ReactECharts option={option} style={{ height: '280px', width: '100%' }} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic text-sm">No data available</div>
      )}

      {cplData && (
        <div className="mt-3 px-4 py-2 bg-gray-50 rounded-lg text-xs w-full border border-gray-200">
          <div className="text-center font-bold text-gray-600 mb-1 border-b border-gray-200 pb-1">CPL Aggregate</div>
          <div className="flex justify-between items-center px-2">
            <span className="text-emerald-600 font-bold">Followed: {cplData.followedScore.toFixed(2)}</span>
            <span className="text-rose-600 font-bold">Ignored: {cplData.ignoredScore.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}


// --- GROUPED BAR CHART COMPONENT (BOTTOM) ---
function ComparisonBarChart({ data, viewName }: { data: ProcessedComparison[], viewName: string }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const itemCode = params[0].axisValue;
          const originalItem = data.find(d => d.code === itemCode);
          
          let html = `
            <div class="text-sm">
              <div class="font-bold border-b border-gray-300 pb-1 mb-1 whitespace-normal max-w-xs break-words">
                ${originalItem?.name} (${itemCode})
              </div>
          `;
          
          params.forEach((p: any) => {
            const color = p.seriesName === 'Followed Recs' ? '#10b981' : '#f43f5e';
            html += `
              <div class="mt-1 flex justify-between gap-4">
                <span>${p.seriesName}:</span> 
                <span class="font-bold" style="color: ${color}">${p.value.toFixed(2)}</span>
              </div>
            `;
          });
          
          html += `</div>`;
          return html;
        }
      },
      legend: {
        data: ['Followed Recs', 'Ignored Recs'],
        top: 0,
        textStyle: { fontWeight: 'bold' }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map(d => d.code),
        axisLabel: { interval: 0, rotate: 30, hideOverlap: true, color: '#6b7280', fontSize: 11 },
        axisTick: { alignWithLabel: true }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
      },
      series: [
        {
          name: 'Followed Recs',
          type: 'bar',
          barGap: '10%', 
          data: data.map(d => d.followedScore),
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
        },
        {
          name: 'Ignored Recs',
          type: 'bar',
          data: data.map(d => d.ignoredScore),
          itemStyle: { color: '#f43f5e', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 capitalize">{viewName} Comparison Distribution</h3>
        <p className="text-sm text-gray-500">Side-by-side impact analysis across all {viewName}s.</p>
      </div>
      {data.length > 0 ? (
        <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />
      ) : (
        <div className="h-[320px] flex items-center justify-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
          No data available for current selection.
        </div>
      )}
    </div>
  );
}


// --- MAIN DASHBOARD ---
export default function StudentComparisonDashboard() {
  const [selectedBatch, setSelectedBatch] = useState<string[]>([]);
  const [selectedMajor, setSelectedMajor] = useState<string[]>([]);
  
  const [allMajors, setAllMajors] = useState<Major[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);

  const [cplData, setCplData] = useState<ProcessedComparison[]>([]);
  const [subCplData, setSubCplData] = useState<ProcessedComparison[]>([]);
  const [bottomChartData, setBottomChartData] = useState<ProcessedComparison[]>([]);
  
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingBottom, setLoadingBottom] = useState(false);
  
  const [bottomView, setBottomView] = useState<BottomChartView>('quality');

  // Fetch Majors & Batches
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [majorsRes, batchesRes] = await Promise.all([
          api.get("/demography/major"),
          api.get("/demography/batch") 
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

  // Fetch Radars (Top Section)
  useEffect(() => {
    const fetchRadars = async () => {
      try {
        setLoadingTop(true);
        const params = new URLSearchParams();
        selectedBatch.forEach(l => params.append("batch_ids", l));
        selectedMajor.forEach(m => params.append("major_ids", m));

        const [cplRes, subCplRes] = await Promise.all([
          api.get('/analytic/student_comparison/cpl', { params }),
          api.get('/analytic/student_comparison/sub_cpl', { params })
        ]);

        setCplData(processComparisonData(cplRes.data));
        setSubCplData(processComparisonData(subCplRes.data));
      } catch {
        toast.error("Failed to load CPL/Sub-CPL comparison data");
      } finally {
        setLoadingTop(false);
      }
    };

    if (selectedMajor.length > 0) fetchRadars();
  }, [selectedBatch, selectedMajor]);

  // Fetch Bottom Chart
  useEffect(() => {
    const controller = new AbortController();
    const fetchBottomChart = async () => {
      try {
        setLoadingBottom(true);
        const params = new URLSearchParams();
        selectedBatch.forEach(l => params.append("batch_ids", l));
        selectedMajor.forEach(m => params.append("major_ids", m));

        const res = await api.get(`/analytic/student_comparison/${bottomView}`, { 
          params,
          signal: controller.signal 
        });
        
        setBottomChartData(processComparisonData(res.data));
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log("Stale request cancelled");
        } else {
          toast.error(`Failed to load ${bottomView} comparison data`);
        }
      } finally {
        setLoadingBottom(false);
      }
    };

    fetchBottomChart();
    return () => {
      controller.abort();
    };
  }, [selectedBatch, selectedMajor, bottomView]);

  const groupedMajors: DropdownGroup[] = useMemo(() => {
    const groups: Record<string, DropdownGroup> = {};
    allMajors.forEach(m => {
      if (!groups[m.faculty_id]) {
        groups[m.faculty_id] = { groupId: m.faculty_id, groupLabel: m.faculty_name, options: [] };
      }
      groups[m.faculty_id].options.push({ id: m.major_id, label: m.major_name });
    });
    return Object.values(groups);
  }, [allMajors]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Recommendation Impact Analysis</h1>
          <p className="text-gray-500 mt-1">Detailed comparison between students who follow system recommendations and those who do not.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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

      {/* TOP SECTION: Radar Charts */}
      <div className="relative mb-8">
        {loadingTop && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Updating Radars...</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cplData.map((cpl) => {
            // Group Sub-CPLs belonging to this CPL
            const relatedSubCpls = subCplData.filter(sub => 
              sub.code.startsWith(cpl.code)
            );

            return (
              <ComparisonRadarChart 
                key={cpl.code}
                title={cpl.code} 
                data={relatedSubCpls} 
                cplData={cpl}
              />
            );
          })}
          
          {!loadingTop && cplData.length === 0 && (
             <div className="col-span-3 text-center py-10 text-gray-500 italic bg-white rounded-xl border border-gray-100 shadow-sm">
               No Sub-CPL comparison data found for this selection.
             </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Grouped Bar Chart */}
      <div className="relative">
        {loadingBottom && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Updating Chart...</div>}
        
        <div className="flex justify-end items-end mb-3">
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

        <ComparisonBarChart data={bottomChartData} viewName={bottomView} />
      </div>
      
    </div>
  );
}