<template>
  <div class="dashboard">
    <el-row :gutter="16" class="stats-row">
      <el-col v-for="s in statCards" :key="s.label" :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-icon" :style="{ background: s.color }">
              <el-icon><component :is="s.icon" /></el-icon>
            </div>
            <div>
              <div class="stat-val">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :xs="24" :lg="16">
        <el-card>
          <template #header><span>销售趋势</span></template>
          <div ref="chartRef" style="height:300px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card>
          <template #header><span>近期待办</span></template>
          <el-timeline>
            <el-timeline-item v-for="item in todoList" :key="item.id" :type="item.type" :timestamp="item.time" placement="top">
              <div class="todo-item">{{ item.text }}</div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null
const statCards = [
  { label: '本月线索', value: '128', color: '#1890ff', icon: 'User' },
  { label: '活跃客户', value: '89', color: '#52c41a', icon: 'OfficeBuilding' },
  { label: '进行中项目', value: '23', color: '#faad14', icon: 'Files' },
  { label: '本月回款(万)', value: '125.6', color: '#f5222d', icon: 'Money' },
]
const todoList = [
  { id: 1, text: '里程碑"需求评审"明日到期', type: 'warning', time: '明日 10:00' },
  { id: 2, text: '合同"ERP升级合同"待审批', type: 'primary', time: '今日 14:00' },
  { id: 3, text: '回款"HK202400012"待确认', type: 'success', time: '今日 09:00' },
]
onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['线索数','签约金额(万)'] },
    xAxis: { type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '线索数', type: 'line', smooth: true, data: [80,102,91,134,90,130,110,128,145,130,152,160] },
      { name: '签约金额(万)', type: 'bar', data: [80,120,100,140,90,110,130,125,160,140,180,200] },
    ]
  })
  window.addEventListener('resize', () => chart?.resize())
})
onBeforeUnmount(() => { chart?.dispose(); window.removeEventListener('resize', () => {}) })
</script>
<style scoped>
.stats-row { margin-bottom: 16px; }
.stat-card { margin-bottom: 16px; }
.stat-inner { display: flex; align-items: center; gap: 16px; }
.stat-icon { width: 56px; height: 56px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; }
.stat-val { font-size: 26px; font-weight: 700; color: #1d2129; }
.stat-label { font-size: 13px; color: #86909c; margin-top: 4px; }
.todo-item { font-size: 13px; color: #4e5969; }
</style>