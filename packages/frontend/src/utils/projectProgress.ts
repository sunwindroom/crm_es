import type { Milestone } from '@/types'

export const calculateProjectProgress = (milestones: Milestone[]): number => {
  if (!milestones?.length) return 0
  const done = milestones.filter(m => m.status === 'completed').length
  return Math.round((done / milestones.length) * 100)
}

export const getProgressColor = (p: number): string => {
  if (p === 100) return '#67c23a'
  if (p >= 80) return '#409eff'
  if (p >= 50) return '#e6a23c'
  return '#f56c6c'
}

export const getProjectStats = (milestones: Milestone[]) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const total = milestones.length
  const completed = milestones.filter(m => m.status === 'completed').length
  const inProgress = milestones.filter(m => m.status === 'in_progress').length
  const notStarted = milestones.filter(m => m.status === 'not_started').length
  const delayed = milestones.filter(m => m.status === 'delayed').length
  const delayedCount = milestones.filter(m => m.status !== 'completed' && m.status !== 'cancelled' && new Date(m.plannedDate) < today).length
  const isDelayed = delayedCount > 0
  const pending = milestones.filter(m => m.status !== 'completed' && m.status !== 'cancelled')
  const lastPending = pending.sort((a,b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()).pop()
  const remainingDays = lastPending ? Math.max(0, Math.ceil((new Date(lastPending.plannedDate).getTime() - today.getTime()) / 86400000)) : 0
  return { total, completed, inProgress, notStarted, delayed, delayedCount, isDelayed, remainingDays, progress: calculateProjectProgress(milestones) }
}

export const getProgressSuggestion = (stats: ReturnType<typeof getProjectStats>): string => {
  if (stats.progress === 100) return '项目已完成，恭喜！'
  if (stats.isDelayed) return `项目已延期，有 ${stats.delayedCount} 个里程碑未按计划完成，建议尽快跟进。`
  if (stats.remainingDays <= 7 && stats.progress < 80) return '项目即将到期，进度较慢，建议优先处理关键里程碑。'
  if (stats.progress >= 80) return '项目进展顺利，继续保持！'
  if (stats.progress >= 50) return '项目进展正常，注意把控节奏。'
  return '项目刚启动，建议制定详细执行计划。'
}

export const getUpcomingMilestones = (milestones: Milestone[]): Milestone[] => {
  const today = new Date(); today.setHours(0,0,0,0)
  const next7 = new Date(today); next7.setDate(next7.getDate() + 7)
  return milestones.filter(m => {
    if (m.status === 'completed') return false
    const d = new Date(m.plannedDate); d.setHours(0,0,0,0)
    return d >= today && d <= next7
  })
}