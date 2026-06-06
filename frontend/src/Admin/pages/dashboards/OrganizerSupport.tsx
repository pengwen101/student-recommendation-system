import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import type { OrganizerSupport, ResourceSupportingX } from '../../../types';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';
import { type CallbackDataParams } from 'echarts/types/dist/shared';

type HeatmapDataPoint = [number, number, number, string, string];

// --- TABLE COMPONENT (Reused & Enhanced) ---

const ITEMS_PER_PAGE = 5;

// Helper function to safely convert string/arrays into a clean array
const getAsArray = (val: string | string[] | undefined | null) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

function ResourceTable({ data, loading }: { data: ResourceSupportingX[], loading: boolean }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 shadow-sm bg-white h-full relative min-h-[400px]">
      {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px] font-medium text-gray-500">Updating Table...</div>}
      
      <div className="overflow-hidden flex-1">
        <table className="w-full table-fixed divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-[25%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Title</th>
              <th scope="col" className="w-[10%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Type</th>
              <th scope="col" className="w-[25%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Organizer</th>
              <th scope="col" className="w-[20%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-left">Topics</th>
              <th scope="col" className="w-[10%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
              <th scope="col" className="w-[10%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-right">Attendees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => {
                const organizers = getAsArray(item.organizers);
                const topics = getAsArray(item.topics);

                return (
                  <tr key={`${item.resource_title}-${idx}`} className="hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                    <td className="px-4 py-2.5 font-medium text-gray-900 break-words whitespace-normal align-top">
                      {item.resource_title}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 capitalize break-words whitespace-normal align-top">
                      {item.resource_type}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {organizers.length > 0 ? (
                          organizers.map((org, i) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 break-words">
                              {org}
                            </span>
                          ))
                        ) : <span className="text-gray-400 italic text-xs">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {topics.length > 0 ? (
                          <>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 break-words">
                              {topics[0]}
                            </span>
                            {topics.length > 1 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 cursor-help" title={topics.slice(1).join(', ')}>
                                + {topics.length - 1}
                              </span>
                            )}
                          </>
                        ) : <span className="text-gray-400 italic text-xs">None</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center align-top">
                       <span className="inline-flex items-center text-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize break-words whitespace-normal">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-right tabular-nums align-top">
                      {item.attendees}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500 italic">
                  No resources found for the current selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg mt-auto">
        <div className="text-xs text-gray-500">
          Showing <span className="font-medium">{data.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, data.length)}</span> of <span className="font-medium">{data.length}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >Prev</button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >Next</button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN DASHBOARD COMPONENT ---

export default function OrganizerSupportDashboard() {
  const [heatmapData, setHeatmapData] = useState<OrganizerSupport[]>([]);
  const [tableData, setTableData] = useState<ResourceSupportingX[]>([]);
  
  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  // Global Filters
  const [selectedCurriculumType, setSelectedCurriculumType] = useState<string[]>(["sub_cpl"]);
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<string[]>(["1", "2", "3", "4"]);

  // Local Heatmap Selection Filters (For drilling down into the table)
  const [activeOrganizerId, setActiveOrganizerId] = useState<string | null>(null);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);

  // 1. Fetch Heatmap Data
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoadingMap(true);
        const params = new URLSearchParams();
        params.append("curriculum_type", selectedCurriculumType[0] || 'sub_cpl');
        selectedStudyLevel.forEach(l => params.append("study_level_ids", l));

        const res = await api.get('/analytic/organizer_support', { params });
        setHeatmapData(res.data);
      } catch {
        toast.error("Failed to load organizer heatmap");
      } finally {
        setLoadingMap(false);
      }
    };
    fetchHeatmap();
  }, [selectedCurriculumType, selectedStudyLevel]);

  // 2. Fetch Table Data
  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoadingTable(true);
        const params = new URLSearchParams();
        selectedStudyLevel.forEach(l => params.append("study_level_ids", l));
        const resourceTypes = ["event"];
        resourceTypes.forEach(t => params.append("resource_types", t));
        
        if (activeOrganizerId) params.append("organizer_ids", activeOrganizerId);
        if (activeCurriculumId) params.append("curriculum_id", activeCurriculumId);

        const res = await api.get('/analytic/resource_supporting_x', { params });
        setTableData(res.data);
      } catch {
        toast.error("Failed to load resources");
      } finally {
        setLoadingTable(false);
      }
    };
    fetchTable();
  }, [selectedStudyLevel, activeOrganizerId, activeCurriculumId]);

  // --- DYNAMIC HEIGHT CALCULATION ---
  const dynamicHeight = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) return 400; // Minimum default
    
    // Find unique Y-axis items
    const uniqueCurriculums = new Set(heatmapData.map(d => d.curriculum_id));
    
    const ROW_HEIGHT = 30; // Pixels per row
    const CHART_PADDING = 150; // Padding for top/bottom margins, labels, and title
    
    return Math.max(400, (uniqueCurriculums.size * ROW_HEIGHT) + CHART_PADDING);
  }, [heatmapData]);


  // --- ECHARTS CONFIGURATION ---
  const { chartOption, uniqueOrganizers, uniqueCurriculums } = useMemo(() => {
    if (!heatmapData || heatmapData.length === 0) {
      return { chartOption: {}, uniqueOrganizers: [], uniqueCurriculums: [] };
    }

    const orgs = Array.from(new Map(heatmapData.map(d => [d.organizer_id, { id: d.organizer_id, name: d.organizer_name }])).values());
    const currs = Array.from(new Map(heatmapData.map(d => [d.curriculum_id, { id: d.curriculum_id, code: d.curriculum_code, name: d.curriculum_name }])).values());

    const orgMap = new Map(orgs.map((o, i) => [o.id, i]));
    const currMap = new Map(currs.map((c, i) => [c.id, i]));

    let maxScore = 0;

    const matrix = heatmapData.map(item => {
      if (item.support_score > maxScore) maxScore = item.support_score;
      return [
        orgMap.get(item.organizer_id),
        currMap.get(item.curriculum_id),
        item.support_score,
        item.organizer_id,
        item.curriculum_id
      ];
    });

    const option = {
      tooltip: {
        position: 'top',
        formatter: (params: CallbackDataParams) => {
          const [xIdx, yIdx, score] = params.data as HeatmapDataPoint;
          return `
            <div class="text-sm">
              <div class="font-bold border-b border-gray-300 pb-1 mb-1">Support Detail</div>
              <div>Organizer: <span class="font-semibold">${orgs[xIdx].name}</span></div>
              <div>Curriculum: <span class="font-semibold">${currs[yIdx].code}</span></div>
              <div class="max-w-xs whitespace-normal">
                Name: <span class="font-semibold break-words">${currs[yIdx].name}</span>
              </div>
              <div class="mt-1">Score: <span class="font-bold text-blue-600">${score.toFixed(2)}</span></div>
              <div class="text-[10px] text-gray-400 mt-2 italic">Click to filter table</div>
            </div>
          `;
        }
      },
      grid: {
        top: '60px',
        bottom: '80px', 
        left: '10%',
        right: '15%', 
        containLabel: true 
      },
      xAxis: {
        type: 'category',
        data: orgs.map(o => o.name),
        triggerEvent: true,
        axisLabel: { interval: 0, rotate: 45, width: 120, overflow: 'truncate', cursor: 'pointer' },
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: currs.map(c => c.code),
        triggerEvent: true,
        axisLabel: { cursor: 'pointer' },
        splitArea: { show: true }
      },
      visualMap: {
        min: 0,
        max: maxScore || 10,
        calculable: true,
        orient: 'vertical',
        right: '2%',
        top: 'center',
        precision: 1,
        dimension: 2,
        inRange: {
          color: ['#eff6ff', '#93c5fd', '#3b82f6', '#1d4ed8']
        }
      },
      series: [{
        name: 'Support Score',
        type: 'heatmap',
        data: matrix,
        label: {
          show: true,
          formatter: (p: CallbackDataParams) => {
            const data = p.data as HeatmapDataPoint;
            return data[2] > 0 ? data[2].toFixed(1) : '';
          }
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };

    return { chartOption: option, uniqueOrganizers: orgs, uniqueCurriculums: currs };
  }, [heatmapData]);

  const onEvents = useMemo(() => ({
    click: (params: CallbackDataParams) => {
      if (params.componentType === 'series') {
        const data = params.data as HeatmapDataPoint;
        setActiveOrganizerId(data[3]);
        setActiveCurriculumId(data[4]);
        toast.success(`Filtered by intersection`);
      } 
      else if (params.componentType === 'xAxis') {
        const orgName = params.value;
        const org = uniqueOrganizers.find(o => o.name === orgName);
        if (org) {
          setActiveOrganizerId(org.id);
          setActiveCurriculumId(null);
          toast.success(`Filtered by Organizer: ${org.name}`);
        }
      } 
      else if (params.componentType === 'yAxis') {
        const currCode = params.value;
        const curr = uniqueCurriculums.find(c => c.code === currCode);
        if (curr) {
          setActiveOrganizerId(null);
          setActiveCurriculumId(curr.id);
          toast.success(`Filtered by Curriculum: ${curr.code}`);
        }
      }
    }
  }), [uniqueOrganizers, uniqueCurriculums]);

  const clearSelection = () => {
    setActiveOrganizerId(null);
    setActiveCurriculumId(null);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dukungan Penyelenggara Kegiatan Terhadap Resource</h1>
          <p className="text-gray-500 mt-1">Klik sel untuk filter tabel resource secara interseksi antara penyelenggara kegiatan dengan {selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())}, atau klik label untuk filter baris ({selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())}) / kolom (penyelenggara kegiatan).</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex gap-2 mb-6">
        <DropdownFilter 
          title="Curriculum Type"
          options={[
            { label: 'CPL', value: 'cpl' },
            { label: 'Sub-CPL', value: 'sub_cpl' },
            { label: 'Quality', value: 'quality' },
            { label: 'Indicator', value: 'indicator' }
          ]}
          selectedValues={selectedCurriculumType}
          onChange={setSelectedCurriculumType}
          multiSelect={false}
        />
        <DropdownFilter 
          title="Study Level"
          options={[
            { label: 'Level 1', value: '1' },
            { label: 'Level 2', value: '2' },
            { label: 'Level 3', value: '3' },
            { label: 'Level 4', value: '4' }
          ]}
          selectedValues={selectedStudyLevel}
          onChange={setSelectedStudyLevel}
          multiSelect={true}
        />
      </div>

      <div className="flex flex-col gap-6">
        {/* Heatmap Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative w-full overflow-x-auto">
          {loadingMap && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Loading Map...</div>}
          
          <div className="flex justify-between items-center mb-2 px-4 sticky left-0">
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed">
              Grafik ini bertujuan untuk melihat intensitas dukungan masing-masing penyelenggara kegiatan terhadap masing-masing {selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())}.
          </div>
            {(activeOrganizerId || activeCurriculumId) && (
              <button 
                onClick={clearSelection}
                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded transition-colors"
              >
                Clear Map Selection x
              </button>
            )}
          </div>

          {/* DYNAMIC HEIGHT IMPLEMENTATION */}
          {heatmapData.length > 0 ? (
            <div className="min-w-[600px]">
                <ReactECharts 
                  option={chartOption} 
                  onEvents={onEvents} 
                  style={{ height: `${dynamicHeight}px`, width: '100%' }} 
                />
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-400 italic">No heatmap data available.</div>
          )}
        </div>

        {/* Resources Table Section */}
        <div className="flex-1">
           <ResourceTable data={tableData} loading={loadingTable} />
        </div>
      </div>
    </div>
  );
}