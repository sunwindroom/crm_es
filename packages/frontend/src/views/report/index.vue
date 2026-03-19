<template>
  <div class="report-page">
    <el-row :gutter="16" class="stats-row">
      <el-col v-for="s in stats" :key="s.label" :xs="24" :sm="12" :md="6">
        <el-card shadow="hover">
          <el-statistic :title="s.label" :value="s.value">
            <template v-if="s.suffix" #suffix><span style="font-size:14px">{{ s.suffix }}</span></template>
          </el-statistic>
          <div :class="s.trend >= 0 ? 'trend-up' : 'trend-down'">
            {{ s.trend >= 0 ? '▲' : '▼' }} {{ Math.abs(s.trend) }}% 较上期
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <el-card><template #header>商机阶段分布</template><div ref="pieRef" style="height:320px"></div></el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card><template #header>项目状态统计</template><div ref="barRef" style="height:320px"></div></el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
const pieRef = ref<HTMLElement>(); const barRef = ref<HTMLElement>()
let pie: echarts.ECharts | null = null; let bar: echarts.ECharts | null = null
const stats = [
  { label: '新增线索', value: 156, suffix: '条', trend: 12.5 },
  { label: '新增客户', value: 89, suffix: '家', trend: 8.3 },
  { label: '合同金额', value: 1256.8, suffix: '万', trend: 15.2 },
  { label: '回款金额', value: 986.5, suffix: '万', trend: 10.8 },
]
onMounted(() => {
  if (pieRef.value) {
    pie = echarts.init(pieRef.value)
    pie.setOption({ tooltip:{ trigger:'item' }, legend:{ orient:'vertical', left:'left' }, series:[{ name:'商机阶段', type:'pie', radius:['40%','70%'], data:[{value:35,name:'初步接触'},{value:28,name:'需求确认'},{value:22,name:'方案报价'},{value:15,name:'商务谈判'},{value:10,name:'签订合同'}] }] })
  }
  if (barRef.value) {
    bar = echarts.init(barRef.value)
    bar.setOption({ tooltip:{trigger:'axis'}, xAxis:{type:'category',data:['规划中','进行中','暂停','已完成','已取消']}, yAxis:{type:'value'}, series:[{ type:'bar', data:[8,25,3,42,5], itemStyle:{ color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#667eea'},{offset:1,color:'#764ba2'}]) } }] })
  }
  window.addEventListener('resize', resize)
})
const resize = () => { pie?.resize(); bar?.resize() }
onBeforeUnmount(() => { pie?.dispose(); bar?.dispose(); window.removeEventListener('resize', resize) })
</script>
<style scoped>
.stats-row { margin-bottom: 16px; }
.trend-up { color: #52c41a; font-size: 12px; margin-top: 8px; }
.trend-down { color: #f5222d; font-size: 12px; margin-top: 8px; }
</style>