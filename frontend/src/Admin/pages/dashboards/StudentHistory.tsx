import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';
import { NestedDropdown, type DropdownGroup } from '../../../components/NestedDropdown';

export interface StudentHistory {
  year: number;
  month: number;
  avg_score: number;
}

export interface Major {
  major_id: string;
  major_name: string;
  faculty_id: string;
  faculty_name: string;
}

// --- LINE CHART COMPONENT ---
function HistoryLineChart({ data }: { data: StudentHistory[] }) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    // Format data for ECharts. Combine year and month into a readable X-Axis label
    const xAxisData = data.map(d => {
      const date = new Date(d.year, d.month - 1); // JS Months are 0-indexed
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    
    const seriesData = data.map(d => d.avg_score);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const item = params[0];
          return `
            <div class="text-sm">
              <div class="font-bold border-b border-gray-300 pb-1 mb-1">${item.name}</div>
              <div class="mt-1 flex justify-between gap-4">
                <span>Avg Mastery Score:</span>
                <span class="font-bold text-blue-600">${item.value.toFixed(3)}</span>
              </div>
            </div>
          `;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false, // Line chart looks better when starting at the edge
        data: xAxisData,
        axisLabel: { color: '#6b7280', fontSize: 11, rotate: 30 },
        axisLine: { lineStyle: { color: '#d1d5db' } }
      },
      yAxis: {
        type: 'value',
        name: 'Cohort Average Score',
        nameTextStyle: { color: '#6b7280', padding: [0, 0, 0, 20] },
        splitLine: { lineStyle: { type: 'dashed', color: '#e5e7eb' } }
      },
      series: [
        {
          name: 'Average Score',
          type: 'line',
          data: seriesData,
          smooth: true, // Curves the line
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#3b82f6', width: 3 },
          itemStyle: { color: '#2563eb', borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, // Light blue fade
                { offset: 1, color: 'rgba(59, 130, 246, 0.0)' }
              ]
            }
          }
        }
      ]
    };
  }, [data]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
      {data.length > 0 ? (
        <ReactECharts option={option} style={{ height: '400px', width: '100%' }} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-lg">
          No historical data available for the current selection.
        </div>
      )}
    </div>
  );
}

// --- MAIN DASHBOARD ---
export default function StudentHistoryDashboard() {
  const [nrpInput, setNrpInput] = useState<string>("");
  const [debouncedNrp, setDebouncedNrp] = useState<string>("");
  const [selectedMajor, setSelectedMajor] = useState<string[]>([]);
  const [selectedStudyLevel, setSelectedStudyLevel] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string[]>([]);
  
  const [allMajors, setAllMajors] = useState<Major[]>([]);

  const [historyData, setHistoryData] = useState<StudentHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce NRP
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNrp(nrpInput), 600);
    return () => clearTimeout(timer);
  }, [nrpInput]);

  // Fetch Dropdowns
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const majorsRes = await api.get("/demography/major");
        const majorsList = Array.isArray(majorsRes.data) ? majorsRes.data : majorsRes.data.majors;
        
        setAllMajors(majorsList || []);
        setSelectedMajor((majorsList || []).map((m: Major) => m.major_id));
      } catch {
        toast.error("Failed to load filters");
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch History Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (debouncedNrp) params.append("nrp", debouncedNrp);
        
        // Ensure academic year is passed correctly
        if (selectedYear.length > 0 && selectedYear[0] !== "all") {
            params.append("academic_year", selectedYear[0]);
        }

        selectedMajor.forEach(m => params.append("major_ids", m));
        selectedStudyLevel.forEach(l => params.append("study_level_ids", l));

        const res = await api.get('/analytic/student_history', { params });
        setHistoryData(res.data);
      } catch {
        toast.error("Failed to load historical data");
      } finally {
        setLoading(false);
      }
    };

    if (selectedMajor.length > 0) fetchData();
  }, [debouncedNrp, selectedMajor, selectedStudyLevel, selectedYear]);

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

  // Generate a dynamic list of recent years based on current date
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [{label: 'All Time', value: 'all'}];
    for(let i=0; i<5; i++){
        years.push({label: (currentYear - i).toString(), value: (currentYear - i).toString()})
    }
    return years;
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Data Historis Kompetensi Mahasiswa</h1>
          <p className="text-gray-500 mt-1">Rata-rata skor CPL mahasiswa setiap bulan.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label htmlFor="nrp_input" className="text-sm font-semibold text-gray-700">Search Individual NRP</label>
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
          title="Academic Year"
          options={yearOptions}
          selectedValues={selectedYear}
          onChange={setSelectedYear}
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

        <NestedDropdown 
            title="Faculty & Major"
            groups={groupedMajors}
            selectedValues={selectedMajor}
            onChange={setSelectedMajor}
        />
      </div>

      <div className="relative">
        {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center rounded-xl backdrop-blur-[1px] font-medium text-gray-500">Loading history...</div>}
        <HistoryLineChart data={historyData} />
      </div>
    </div>
  );
}