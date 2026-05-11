import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import type { ResourceCharacteristic, Organizer, Resource } from '../../../types';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';
import { type CallbackDataParams } from 'echarts/types/dist/shared';

interface ResourceCharacteristicPayload {
  value: [number, number];
  resource_id: string;
  sub_cpl_count: number;
  sub_cpl_avg_support: number;
  itemStyle?: { color: string; opacity: number };
  symbolSize?: number;
}

interface EChartsClickEvent<T> {
  data?: T;
  dataIndex: number;
  componentType: string;
  seriesType: string;
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

export function ResourceCharacteristicChart({ data, selectedId, onSelect }: { data: ResourceCharacteristic[], selectedId: string | null, onSelect: (id: string) => void }) {
  const option = useMemo(() => {
    const chartData: ResourceCharacteristicPayload[] = data.map((item) => {
      const isSelected = selectedId === item.resource_id;
      const isFaded = selectedId !== null && !isSelected;
      
      return {
        value: [item.sub_cpl_count, item.sub_cpl_avg_support],
        resource_id: item.resource_id,
        sub_cpl_count: item.sub_cpl_count,
        sub_cpl_avg_support: item.sub_cpl_avg_support,
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
        formatter: (params: ScatterTooltipParams<ResourceCharacteristicPayload> | ScatterTooltipParams<ResourceCharacteristicPayload>[]) => {
          const pointParams = Array.isArray(params) ? params[0] : params;
          const { sub_cpl_count, sub_cpl_avg_support } = pointParams.data;
          
          return `
          <div class="max-w-xs whitespace-normal wrap-break-word text-sm">
            Support Count: <span class="font-bold">${sub_cpl_count}</span><br/>
            Average Support: <span class="font-bold">${sub_cpl_avg_support}</span>
          </div>
        `;
        },
      },
      xAxis: {
        type: 'value',
        name: 'Support Count',
        nameLocation: 'middle',
        nameGap: 25,
      },
      yAxis: {
        type: 'value',
        name: 'Average Support',
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
    click: (params: EChartsClickEvent<ResourceCharacteristicPayload>) => {
      if (params.data) { 
        onSelect(params.data.resource_id);
      }
    }
  }), [onSelect]);

  return <ReactECharts option={option} onEvents={onEvents} style={{ height: '300px' }} />;
}

export function Support({ data }: { data: { code: string; weight: number; name?: string; [key: string]: string | number | undefined }[] }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    // Sort data descending (highest weight first)
    const sortedData = [...data].sort((a, b) => b.weight - a.weight);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        // Custom formatter to show the name and weight when hovered
        formatter: (params: CallbackDataParams | CallbackDataParams[]) => {
          const item = (Array.isArray(params) ? params[0].data : params.data) as { name?: string; code?: string; weight?: number };
          if (!item) return '';
          
          const displayName = item.name ? item.name : item.code;
          return `
            <div class="text-sm">
              <div class="font-bold border-b border-gray-300 pb-1 mb-1 whitespace-normal max-w-xs break-words">
                ${displayName}
              </div>
              <div>
                Weight: <span class="font-semibold">${item.weight}</span>
              </div>
            </div>
          `;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '5%',
        top: '5%',
        containLabel: true
      },
      dataset: {
        source: sortedData
      },
      xAxis: {
        type: 'value',
        splitLine: {
          lineStyle: { type: 'dashed', color: '#e5e7eb' }
        }
      },
      yAxis: {
        type: 'category',
        inverse: true, // Renders the first item in our sorted array at the top
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          width: 100, // Optional: prevents extremely long codes from pushing the chart too far right
          overflow: 'truncate'
        },
        axisTick: { alignWithLabel: true }
      },
      series: [
        {
          name: 'Support Weight',
          type: 'bar',
          barWidth: '50%',
          encode: {
            x: 'weight',
            y: 'code'
          },
          itemStyle: {
            color: '#3b82f6',
            borderRadius: [0, 4, 4, 0] // Rounded right corners for horizontal bars
          }
        }
      ]
    };
  }, [data]);

  return <ReactECharts option={option} style={{ height: '280px', width: '100%' }} />;
}

// Types for our View Toggle
type CalculationView = 'subcpls' | 'qualities' | 'indicators';

export default function ResourceCharacteristic() {
    const [data, setData] = useState<ResourceCharacteristic[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    
    // Filters
    const [selectedResourceType, setSelectedResourceType] = useState<string[]>(["book", "event", "article", "video"]);
    const [allOrganizers, setAllOrganizers] = useState<Organizer[]>([]);
    const [selectedStudyLevel, setSelectedStudyLevel] = useState<string[]>(["1", "2", "3", "4"]);
    const [selectedOrganizer, setSelectedOrganizer] = useState<string[]>([]);
    
    // Detail View States
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
    const [selectedResourceDetail, setSelectedResourceDetail] = useState<Resource | null>(null);
    const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
    const [supportView, setSupportView] = useState<CalculationView>('subcpls');

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

    useEffect(()=> {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Create URLSearchParams to ensure standard serialization (prevents [] array issues)
                const params = new URLSearchParams();
                selectedResourceType.forEach(t => params.append("resource_types", t));
                selectedStudyLevel.forEach(l => params.append("study_level_ids", l));
                selectedOrganizer.forEach(o => params.append("organizer_ids", o));

                const result = await api.get(`analytic/resource_characteristic`, { params });
                setData(result.data);
                
                // Reset detail view if filters change
                setSelectedResourceId(null);
            } catch {
                toast.error("Failed fetching data.");
            } finally {
                setLoading(false);
            }
        }

        if (selectedOrganizer.length > 0) {
           fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrganizer, selectedResourceType, selectedStudyLevel]);

    useEffect( () => {
        if (!selectedResourceId) {
          setSelectedResourceDetail(null);
          return;
        }

        const fetchDetails = async ()=> {
            try {
                setDetailsLoading(true);
                const result = await api.get(`resource/${selectedResourceId}`)
                setSelectedResourceDetail(result.data.resource_details);
                // Reset the chart view to sub_cpl automatically when a new point is clicked
                setSupportView('subcpls');
            } catch {
                toast.error("Failed fetching resource detail.");
            } finally {
                setDetailsLoading(false);
            }
        }

        fetchDetails();
    }, [selectedResourceId]);

    const handleResourceIdSelect = (id: string) => {
        setSelectedResourceId(prev => prev === id ? null : id);
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            <div className="mb-6 flex justify-between items-end">
              <div>
                  <h1 className="text-3xl font-bold text-gray-800">Resource Characteristics</h1>
                  <p className="text-gray-500 mt-1">Select a point on the scatter plot to drill down into resource details.</p>
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex gap-2 mb-6">
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

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Scatter Plot Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative h-full min-h-[350px]">
                  {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] text-gray-500 font-medium">Loading map...</div>}
                  {data && <ResourceCharacteristicChart data={data} onSelect={handleResourceIdSelect} selectedId={selectedResourceId}/>}
                </div>

                {/* Details Panel Card */}
                {selectedResourceId && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative flex flex-col h-full min-h-[350px]">
                      {detailsLoading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center rounded-xl backdrop-blur-[2px] text-gray-500 font-medium">Loading details...</div>}
                      
                      {selectedResourceDetail && (
                        <>
                          <div className="mb-5">
                            <h2 className="text-xl font-bold text-gray-800 break-words mb-4">
                              {selectedResourceDetail.name}
                            </h2>
                            
                            <div className="flex flex-wrap gap-x-8 gap-y-4">
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type</span>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 capitalize border border-blue-100">
                                  {selectedResourceDetail.type}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Organizers</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedResourceDetail.organizers && selectedResourceDetail.organizers.length > 0 ? (
                                    selectedResourceDetail.organizers.map((org, i) => (
                                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                        {org.name}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">No organizers listed</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Chart Segment */}
                          <div className="mt-auto border-t border-gray-100 pt-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <h3 className="text-sm font-bold text-gray-700">Support Distribution</h3>
                              
                              {/* Toggle Buttons */}
                              <div className="flex bg-gray-100/80 p-1 rounded-lg">
                                {(['subcpls', 'qualities', 'indicators'] as CalculationView[]).map((view) => (
                                  <button
                                    key={view}
                                    onClick={() => setSupportView(view)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ease-in-out ${
                                      supportView === view 
                                        ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200/50' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                                  >
                                    {view.replace('_', '-').toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Render the Bar Chart or Empty State */}
                            <div className="min-h-[280px]">
                              {selectedResourceDetail.calculations && selectedResourceDetail.calculations[supportView] ? (
                                <Support data={selectedResourceDetail.calculations[supportView] as []} />
                              ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
                                  No {viewToLabel(supportView)} data available for this resource.
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                  </div>
                )}
            </div>
        </div>
    )
}

// Small helper just for the empty state message
function viewToLabel(view: string) {
  if (view === 'subcpls') return 'Sub-CPL';
  if (view === 'qualities') return 'Qualities';
  return 'Indicators';
}