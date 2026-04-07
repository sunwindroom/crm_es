<template>
  <div class="trend-chart">
    <div v-if="title" class="chart-title">{{ title }}</div>
    <div ref="chartRef" class="chart-container" :style="{ height: height }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

interface TrendData {
  period: string;
  amount: number;
  count?: number;
  growth?: number;
  yoyGrowth?: number;
}

interface Props {
  data: TrendData[];
  title?: string;
  height?: string;
  showGrowth?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px',
  showGrowth: false
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

  const option: any = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = props.data[params[0].dataIndex];
        let html = `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${data.period}</div>
            <div>金额: ¥${data.amount.toLocaleString()}</div>
        `;
        if (data.count !== undefined) {
          html += `<div>数量: ${data.count}</div>`;
        }
        if (data.growth !== undefined) {
          const growthColor = data.growth >= 0 ? '#67c23a' : '#f56c6c';
          html += `<div>环比: <span style="color: ${growthColor}">${data.growth >= 0 ? '+' : ''}${data.growth.toFixed(2)}%</span></div>`;
        }
        if (data.yoyGrowth !== undefined) {
          const yoyColor = data.yoyGrowth >= 0 ? '#67c23a' : '#f56c6c';
          html += `<div>同比: <span style="color: ${yoyColor}">${data.yoyGrowth >= 0 ? '+' : ''}${data.yoyGrowth.toFixed(2)}%</span></div>`;
        }
        html += '</div>';
        return html;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.period),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return `${(value / 10000).toFixed(1)}万`;
          }
          return value.toString();
        }
      }
    },
    series: [{
      data: props.data.map(d => d.amount),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: {
        color: '#409eff'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      }
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

<style scoped>
.trend-chart {
  width: 100%;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #409eff;
}

.chart-container {
  width: 100%;
}
</style>
