<template>
  <div ref="chartRef" :style="{ width: width, height: height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

interface PieData {
  value: string;
  count: number;
  percentage: number;
}

interface Props {
  data: PieData[];
  title?: string;
  width?: string;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '300px'
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
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = props.data[params.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.value}</div>
            <div>数量: ${data.count}</div>
            <div>占比: ${data.percentage.toFixed(2)}%</div>
          </div>
        `;
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}: {d}%'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: props.data.map(d => ({
        name: d.value,
        value: d.count
      }))
    }]
  };

  chartInstance.setOption(option);
}

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>
