import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import type { SupportLackGap, Dashboard as DashboardType, Organizer, ResourceSupportingX } from '../../../types';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';

const CURRICULUM_HIERARCHY: Record<string, string> = {
  'cpl': 'sub_cpl',
  'sub_cpl': 'quality',
  'quality': 'indicator',
  'indicator': ""
};

interface EChartsClickEvent<T> {
  data?: T;
  dataIndex: number;
  componentType: string;
  seriesType: string;
}

interface ChartDataPayload {
  value: [number, number];
  code: string;
  name: string;
  id: string;
  resource_count: number;
  student_count: number;
  avg_lack_score: number;
  avg_support_score: number;
  itemStyle?: { color: string; opacity: number };
  symbolSize?: number;
}

interface DashboardParams {
  resource_types: string[];
  study_level_ids: string[];
  organizer_ids: string[];
  curriculum_id?: string;
}

interface CountAverageDataPayload {
  id: string;
  value: [number, number];
  code: string;
  name: string;
}

interface ScatterTooltipParams<T> {
  data: T;
  componentType: string;
  seriesType: string;
  seriesIndex: number;
  seriesName: string;
  name: string;
  dataIndex: number;
  color: string;
}

export function SupportLackGapChart({ data, selectedId, onSelect }: { data: SupportLackGap[], selectedId: string | null, onSelect: (id: string) => void }) {
  const option = useMemo(() => {
    const chartData: ChartDataPayload[] = data.map((item) => {
      const isSelected = selectedId === item.id;
      const isFaded = selectedId !== null && !isSelected;
      
      return {
        value: [item.support_score, item.lack_score],
        code: item.code,
        name: item.name,
        id: item.id,
        resource_count: item.resource_count,
        student_count: item.student_count,
        avg_lack_score: item.avg_lack_score,
        avg_support_score: item.avg_support_score,
        symbolSize: isSelected ? 16 : 10,
        itemStyle: {
          color: isSelected ? '#ef4444' : '#3b82f6',
          opacity: isFaded ? 0.3 : 1,
        }
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: ScatterTooltipParams<ChartDataPayload> | ScatterTooltipParams<ChartDataPayload>[]) => {
          const pointParams = Array.isArray(params) ? params[0] : params;
          const { 
            code, name, value, 
            student_count, resource_count, 
            avg_support_score, avg_lack_score 
          } = pointParams.data;
          
          return `
          <div class="max-w-xs whitespace-normal wrap-break-word text-sm">
            <div class="font-semibold border-b border-gray-300 pb-1 mb-1">
              ${name} (${code})
            </div>
            <div class="leading-relaxed">
              Support Score: <span class="font-bold">${value[0]}</span> <span class="italic text-gray-500">(Avg: ${avg_support_score})</span><br/>
              Lack Score: <span class="font-bold">${value[1]}</span> <span class="italic text-gray-500">(Avg: ${avg_lack_score})</span><br/>
              <hr class="border-t border-dashed border-gray-300 my-2" />
              Students: <span class="font-bold">${student_count}</span><br/>
              Resources: <span class="font-bold">${resource_count}</span>
            </div>
          </div>
        `;
        },
      },
      xAxis: {
        type: 'value',
        name: 'Support',
        nameLocation: 'middle',
        nameGap: 25,
      },
      yAxis: {
        type: 'value',
        name: 'Lack',
      },
      series: [
        {
          data: chartData,
          type: 'scatter'
        },
      ],
    };
  }, [data, selectedId]);

  const onEvents = useMemo(() => ({
    click: (params: EChartsClickEvent<ChartDataPayload>) => {
      if (params.data) { // Assuming match is via ID, if payload doesn't map ID directly, ensure ID is mapped in ChartDataPayload
        // Note: I added item.id mapping to ChartDataPayload above
        onSelect(params.data.id);
      }
    }
  }), [onSelect]);

  return <ReactECharts option={option} onEvents={onEvents} style={{ height: '300px' }} />;
}

export function CountAverageChart({ data, selectedId, onSelect }: { data: SupportLackGap[], selectedId: string | null, onSelect: (id: string) => void }) {
  const option = useMemo(() => {
    const chartData: CountAverageDataPayload[] = data.map((item) => {
      const isSelected = selectedId === item.id;
      const isFaded = selectedId !== null && !isSelected;
      return {
        id: item.id,
        value: [item.resource_count, item.avg_support_score],
        code: item.code,
        name: item.name,
        symbolSize: isSelected ? 16 : 10,
        itemStyle: {
          color: isSelected ? '#ef4444' : '#10b981',
          opacity: isFaded ? 0.3 : 1,
        }
    }});

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: ScatterTooltipParams<CountAverageDataPayload> | ScatterTooltipParams<CountAverageDataPayload>[]) => {
          const pointParams = Array.isArray(params) ? params[0] : params;
          const { 
            code, name, value
          } = pointParams.data;
          
          return `
          <div class="max-w-xs whitespace-normal wrap-break-word text-sm">
            <div class="font-semibold border-b border-gray-300 pb-1 mb-1">
              ${name} (${code})
            </div>
            <div class="leading-relaxed">
              Resource Count: <span class="font-bold">${value[0]}</span><br/>
              Resource Average: <span class="font-bold">${value[1]}</span><br/>
            </div>
          </div>
        `;
        },
      },
      xAxis: {
        type: 'value',
        name: 'Count',
        nameLocation: 'middle',
        nameGap: 25,
      },
      yAxis: {
        type: 'value',
        name: 'Average',
      },
      series: [
        {
          data: chartData,
          type: 'scatter',
        },
      ],
    };
  }, [data, selectedId]);

  const onEvents = useMemo(() => ({
    click: (params: EChartsClickEvent<CountAverageDataPayload>) => {
      if (params.data) {
        onSelect(params.data.id);
      }
    }
  }), [onSelect]);

  return <ReactECharts option={option} onEvents={onEvents} style={{ height: '300px' }} />;
}

const ITEMS_PER_PAGE = 3;

export function SupportLackGapList({ data, selectedId, onSelect }: { data: SupportLackGap[], selectedId: string | null, onSelect: (id: string) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [prevSelectedId, setPrevSelectedId] = useState(selectedId);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const ratioA = a.student_count === 0 
        ? (a.resource_count === 0 ? 0 : Infinity) 
        : a.resource_count / a.student_count;
        
      const ratioB = b.student_count === 0 
        ? (b.resource_count === 0 ? 0 : Infinity) 
        : b.resource_count / b.student_count;

      return ratioA - ratioB;
    });
  }, [data]);

  if (selectedId !== prevSelectedId) {
    setPrevSelectedId(selectedId); // Sync the tracker
    
    if (selectedId) {
      const index = sortedData.findIndex(item => item.id === selectedId);
      if (index !== -1) {
        setCurrentPage(Math.floor(index / ITEMS_PER_PAGE) + 1);
      }
    }
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

return (
    <div className="flex flex-col rounded-lg border border-gray-200 shadow-sm bg-white h-full">
      {/* Removed overflow-x-auto, added overflow-hidden to prevent horizontal scroll */}
      <div className="overflow-hidden flex-1"> 
        <table className="w-full table-fixed divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-[20%] px-4 py-2.5 font-semibold text-gray-700">Code</th>
              <th scope="col" className="w-[50%] px-4 py-2.5 font-semibold text-gray-700">Name</th>
              <th scope="col" className="w-[15%] px-4 py-2.5 font-semibold text-gray-700">Need</th>
              <th scope="col" className="w-[15%] px-4 py-2.5 font-semibold text-gray-700">Support</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => {
                const isSelected = item.id === selectedId;
                
                return (
                  <tr 
                    key={item.code} 
                    className={`transition-colors duration-150 ease-in-out cursor-pointer ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-blue-50/50 border-l-4 border-transparent'}`} 
                    onClick={() => onSelect(item.id)}
                  >
                    {/* Replaced truncate with break-words */}
                    <td className="px-4 py-2.5 font-medium text-gray-900 break-words whitespace-normal">
                      {item.code}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 break-words whitespace-normal">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-right tabular-nums align-top">
                      {item.student_count}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-right tabular-nums align-top">
                      {item.resource_count}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 rounded-b-lg mt-auto">
        <div className="text-xs text-gray-500">
          Showing <span className="font-medium">{sortedData.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)}</span> of <span className="font-medium">{sortedData.length}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResourceSupportingXList({ data }: { data: ResourceSupportingX[] }) {
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
    <div className="flex flex-col rounded-lg border border-gray-200 shadow-sm bg-white h-full">
      {/* Removed overflow-x-auto, added overflow-hidden */}
      <div className="overflow-hidden flex-1">
        <table className="w-full table-fixed divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-[25%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Title</th>
              <th scope="col" className="w-[15%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Type</th>
              <th scope="col" className="w-[20%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider">Organizer</th>
              <th scope="col" className="w-[20%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-left">Topics</th>
              <th scope="col" className="w-[10%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-center">Status</th>
              <th scope="col" className="w-[10%] px-4 py-2.5 font-semibold text-gray-700 uppercase tracking-wider text-right">Attendees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, idx) => {
                return (
                  <tr key={`${item.resource_title}-${idx}`} className="hover:bg-blue-50 transition-colors duration-150 ease-in-out">
                    {/* Replaced truncate with break-words whitespace-normal */}
                    <td className="px-4 py-2.5 text-gray-900 break-words whitespace-normal align-top">
                      {item.resource_title}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 capitalize break-words whitespace-normal align-top">
                      {item.resource_type}
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {item.organizers.length > 0 ? (
                          item.organizers.map((org, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 break-words"
                            >
                              {org}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {item.topics.length > 0 ? (
                          <>
                            <span className="text-center inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 break-words">
                              {item.topics[0]}
                            </span>
                            {item.topics.length > 1 && (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 cursor-help"
                                title={item.topics.slice(1).join(', ')}
                              >
                                + {item.topics.length - 1}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 italic text-xs">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-center align-top">
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
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 italic">
                  No supporting resources found.
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
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage === totalPages}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );  
}

export default function SupportLackGap() {
  const [data, setData] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurriculumType, setSelectedCurriculumType] = useState<string[]>(["cpl"]);
  const [drillPath, setDrillPath] = useState<{ id: string, type: string, name: string }[]>([]);
  const currentParentId = drillPath.length > 0 ? drillPath[drillPath.length - 1].id : null;
  const [selectedResourceType, setSelectedResourceType] = useState<string[]>(["book", "event", "article", "video"]);
  const [allOrganizers, setAllOrganizers] = useState<Organizer[]>([]);
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<string[]>(["1", "2", "3", "4"]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<string[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const result = await api.get("organizer");
        const organizer_ids = result.data.organizers.map((organizer: Organizer) => organizer.organizer_id);
        setAllOrganizers(result.data.organizers);
        setSelectedOrganizer(organizer_ids);
      } catch {
        toast.error("Failed to load organizers");
      }
    }
    fetchOrganizers();
  }, []);

  // Main fetch: Triggered by primary filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params: DashboardParams = { 
          resource_types: selectedResourceType, 
          study_level_ids: selectedStudyLevel, 
          organizer_ids: selectedOrganizer
        };

        if (currentParentId) {
            params.curriculum_id = currentParentId;
        }

        console.log(selectedResourceType);
        console.log(selectedStudyLevel);
        console.log(selectedOrganizer);
        
        const [supportLackGapRes, resourceSupportingXRes] = await Promise.all([
          api.get(`/analytic/support_lack_gap/${selectedCurriculumType[0]}`, { params }),
          api.get(`/analytic/resource_supporting_x`, { params })
        ]);
        
        setData({
          support_lack_gap: supportLackGapRes.data as SupportLackGap[],
          resource_supporting_x: resourceSupportingXRes.data as ResourceSupportingX[]
        });
        
        // Reset selection when root filters change
        setSelectedCurriculumId(null);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    } 
    
    // Only fetch if organizers are loaded (or if empty is allowed)
    if (selectedOrganizer.length > 0) {
       fetchData();
    }
  }, [selectedCurriculumType, selectedOrganizer, selectedResourceType, selectedStudyLevel, currentParentId]);

  const handleDrillDown = () => {
    if (!selectedCurriculumId || !data) return;

    const selectedItem = data.support_lack_gap.find(item => item.id === selectedCurriculumId);
    const nextType = CURRICULUM_HIERARCHY[selectedCurriculumType[0]];

    if (nextType && selectedItem) {
        setDrillPath(prev => [...prev, { id: selectedCurriculumId, type: selectedCurriculumType[0], name: selectedItem.code }]);
        setSelectedCurriculumType([nextType]);
        setSelectedCurriculumId(null);
    }
  };

  // Safe Breadcrumb navigation
  const navigateToLevel = (levelIndex: number) => {
      if (levelIndex === -1) {
          setDrillPath([]);
          setSelectedCurriculumType(['cpl']);
      } else {
          // Keep path up to the clicked level
          const newPath = drillPath.slice(0, levelIndex + 1);
          setDrillPath(newPath);
          // The type to view is the child of the clicked breadcrumb
          const parentType = newPath[newPath.length - 1].type;
          setSelectedCurriculumType([CURRICULUM_HIERARCHY[parentType]]);
      }
      setSelectedCurriculumId(null);
  }

  // Detail Fetch: Triggered when a point on the scatter plot is selected/deselected
  useEffect(() => {
    const fetchDetailData = async () => {
      try {
        setLoading(true);
        const params: DashboardParams = { 
          resource_types: selectedResourceType, 
          study_level_ids: selectedStudyLevel, 
          organizer_ids: selectedOrganizer 
        };
        
        // Passing ID filters the resources list. Dropping the ID fetches global general list.
        if (selectedCurriculumId) {
          params.curriculum_id = selectedCurriculumId;
        }
        
        const res = await api.get(`/analytic/resource_supporting_x`, { params });
        const resourceSupportingX = res.data as ResourceSupportingX[];
        
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            resource_supporting_x: resourceSupportingX
          };
        });
      } catch {
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    }; 

    // Prevent overriding the initial data fetch mount
    if (data) {
      fetchDetailData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurriculumId]);

  const handleCurriculumIdSelect = (id: string) => {
    setSelectedCurriculumId(prev => prev === id ? null : id);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gap Antara Dukungan Resource dan Kebutuhan Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Klik titik pada salah satu grafik untuk highlight dan filter grafik lainnya.</p>
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
          title="Resource Type"
          options={[
            { label: 'Event', value: 'event' },
            { label: 'Book', value: 'book' },
            { label: 'Article', value: 'article' },
            { label: 'Video', value: 'video' }
          ]}
          selectedValues={selectedResourceType}
          onChange={setSelectedResourceType}
          multiSelect={true}
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
        <DropdownFilter 
          title="Organizer"
          options={allOrganizers.map(o => ({ 
            label: o.name, 
            value: o.organizer_id 
          }))}
          selectedValues={selectedOrganizer}
          onChange={setSelectedOrganizer}
          multiSelect={true}
        />
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 text-sm">
          <button 
              onClick={() => navigateToLevel(-1)}
              className={`hover:text-blue-600 transition-colors ${drillPath.length === 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
          >
              Root (CPL)
          </button>
          
          {drillPath.map((crumb, index) => (
              <span key={crumb.id} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <button 
                      onClick={() => navigateToLevel(index)}
                      className={`hover:text-blue-600 transition-colors ${index === drillPath.length - 1 ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                  >
                      {crumb.name}
                  </button>
              </span>
          ))}
      </div>

      {/* Contextual Action Bar (Appears when a node is selected) */}
      {selectedCurriculumId && data && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                  <div>
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Selected Node</span>
                      <h3 className="font-bold text-gray-900">
                          {data.support_lack_gap.find(i => i.id === selectedCurriculumId)?.name}
                      </h3>
                  </div>
              </div>
              
              <div className="flex gap-3">
                  <button 
                      onClick={() => setSelectedCurriculumId(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                      Clear Selection
                  </button>
                  
                  {/* Only show drill down if there is a level below this one */}
                  {CURRICULUM_HIERARCHY[selectedCurriculumType[0]] && (
                      <button 
                          onClick={handleDrillDown}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                          Drill Down to {CURRICULUM_HIERARCHY[selectedCurriculumType[0]].replace('_', '-').toUpperCase()}
                      </button>
                  )}
              </div>
          </div>
      )}

      {/* Grid Layout */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
            {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]" />}
            <SupportLackGapChart data={data.support_lack_gap} onSelect={handleCurriculumIdSelect} selectedId={selectedCurriculumId}/>
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed">
              Grafik ini bertujuan untuk melihat {selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())} mana yang kurang didukung oleh resource, namun banyak dibutuhkan mahasiswa (kiri atas). Atau sebaliknya, {selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())} mana yang memiliki dukungan resource yang besar, namun sedikit dibutuhkan oleh mahasiswa (kanan bawah).
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
            {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]" />}
            <SupportLackGapList data={data.support_lack_gap} onSelect={handleCurriculumIdSelect} selectedId={selectedCurriculumId}/>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
            {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]" />}
            <CountAverageChart data={data.support_lack_gap} onSelect={handleCurriculumIdSelect} selectedId={selectedCurriculumId}/>
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 leading-relaxed">
              Grafik ini bertujuan untuk melihat jumlah resource dan rata-rata dukungan resource pada {selectedCurriculumType[0].replace('_', '-').replace(/\b\w/g, s => s.toUpperCase())}. Titik di kiri atas berarti jumlah resource sedikit namun intensitas dukungannya besar (kuantitas {"<"} kualitas), sedangkan titik di kanan bawah berarti jumlah resource banyak namun intensitas dukungannya sedikit (kuantitas {">"} kualitas)
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
            {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px]" />}
            <ResourceSupportingXList data={data.resource_supporting_x}/>
          </div>
        </div>
      )}
    </div>
  );
}