import { useMemo, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import api from "../../../api/axios";
import type { ResourceCharacteristic, ResourceCharacteristic } from '../../../types';
import toast from "react-hot-toast";
import { DropdownFilter } from '../../../components/DropDownFilter';

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
            ${sub_cpl_count} | ${sub_cpl_avg_support}
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
    click: (params: EChartsClickEvent<ResourceCharacteristicPayload>) => {
      if (params.data) { 
        onSelect(params.data.resource_id);
      }
    }
  }), [onSelect]);

  return <ReactECharts option={option} onEvents={onEvents} style={{ height: '300px' }} />;
}

export default function ResourceCharacteristic() {
    [data, setData] = useState<ResourceCharacteristic[] | null>(null);
    [loading, setLoading] = useState<boolean>(true);

    useEffect(()=> {
        const fetchData = async () => {
            
        }
    }, [])

}