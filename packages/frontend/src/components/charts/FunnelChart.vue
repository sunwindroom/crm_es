<template>
  <div ref="chartRef" :style="{ width: width, height: height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

interface FunnelData {
  name: string;
  count: number;
  amount: number;
  weightedAmount: number;
}

interface Props {
  data: FunnelData[];
  width?: string;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px'
});

const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);
    updateChart();
  }
});

watch(() => props.data, updateChart, { deep: true });

function updateChart() {
  if (!chartInstance) return;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = props.data[params.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${data.name}</div>
            <div>商机数: ${data.count}</div>
            <div>金额: ¥${data.amount.toLocaleString()}</div>
            <div>加权金额: ¥${data.weightedAmount.toLocaleString()}</div>
          </div>
        `;
      }
    },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: 100,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}',
        fontSize: 14,
        color: '#fff'
      },
      labelLine: {
        length: 10,
        lineStyle: {
          width: 1,
          type: 'solid'
        }
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1
      },
      emphasis: {
        label: {
          fontSize: 16
        }
      },
      data: props.data.map((d, index) => ({
        name: d.name,
        value: d.count,
        itemStyle: {
          color: getColor(index)
        }
      }))
    }]
  };

  chartInstance.setOption(option);
}

function getColor(index: number): string {
  const colors = [
    '#5470c6',
    '#91cc75',
    '#fac858',
    '#ee6666',
    '#73c0de',
    '#3ba272',
    '#fc8452',
    '#9a60b4'
  ];
  return colors[index % colors.length];
}

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>
