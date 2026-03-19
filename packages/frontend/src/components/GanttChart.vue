<template>
  <div class="gantt-chart">
    <div v-if="!milestones.length" class="empty">暂无里程碑数据</div>
    <template v-else>
      <div class="gantt-legend">
        <span v-for="s in statusList" :key="s.value" class="legend-item">
          <span class="dot" :style="{ background: s.color }"></span>{{ s.label }}
        </span>
      </div>
      <div class="gantt-body">
        <div v-for="m in milestones" :key="m.id" class="gantt-row">
          <div class="gantt-name">
            <el-tag :type="statusType(m.status)" size="small">{{ statusLabel(m.status) }}</el-tag>
            <span class="ms-name">{{ m.name }}</span>
          </div>
          <div class="gantt-bar-wrap">
            <div class="gantt-bar" :style="barStyle(m)" @click="$emit('click', m)">
              <span>{{ m.plannedDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup lang="ts">
import type { Milestone } from '@/types'
const props = defineProps<{ milestones: Milestone[]; startDate?: string; endDate?: string }>()
defineEmits(['click'])
const statusList = [
  { value: 'not_started', label: '待开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#e6a23c' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'delayed', label: '已延期', color: '#f56c6c' },
]
const statusLabel = (s: string) => statusList.find(x => x.value === s)?.label ?? s
const statusType = (s: string): any => ({ not_started: 'info', in_progress: 'warning', completed: 'success', delayed: 'danger' }[s] ?? 'info')
const barStyle = (m: Milestone) => {
  const dates = props.milestones.map(x => x.plannedDate).sort()
  const minDate = props.startDate || dates[0]
  const maxDate = props.endDate || dates[dates.length - 1]
  const total = new Date(maxDate).getTime() - new Date(minDate).getTime() || 1
  const start = (new Date(m.plannedDate).getTime() - new Date(minDate).getTime()) / total * 80
  const colors: any = { not_started: '#909399', in_progress: '#e6a23c', completed: '#67c23a', delayed: '#f56c6c' }
  return { left: `${Math.max(0, start)}%`, background: colors[m.status] || '#909399', width: '60px', minWidth: '60px' }
}
</script>
<style scoped>
.gantt-chart { overflow-x: auto; }
.empty { text-align: center; color: #909399; padding: 40px; }
.gantt-legend { display: flex; gap: 20px; margin-bottom: 16px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.gantt-row { display: flex; align-items: center; height: 48px; border-bottom: 1px solid #f0f0f0; }
.gantt-name { width: 280px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding-right: 12px; }
.ms-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gantt-bar-wrap { flex: 1; position: relative; height: 32px; }
.gantt-bar { position: absolute; height: 28px; top: 2px; border-radius: 4px; display: flex; align-items: center; padding: 0 8px; font-size: 11px; color: white; cursor: pointer; transition: opacity .2s; white-space: nowrap; }
.gantt-bar:hover { opacity: .85; }
</style>
