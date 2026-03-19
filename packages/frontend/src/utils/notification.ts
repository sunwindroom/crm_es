import { ElNotification } from 'element-plus'
import type { Milestone } from '@/types'

export const sendMilestoneDueNotification = (m: Milestone) => {
  const days = Math.ceil((new Date(m.plannedDate).getTime() - Date.now()) / 86400000)
  ElNotification({ title: '里程碑即将到期', message: `"${m.name}" 将在 ${days} 天后到期`, type: 'warning', duration: 5000 })
}
export const sendMilestoneDelayedNotification = (m: Milestone) => {
  ElNotification({ title: '里程碑已延期', message: `"${m.name}" 已延期，请及时处理`, type: 'error', duration: 0 })
}
export const sendMilestoneCompletedNotification = (m: Milestone) => {
  ElNotification({ title: '里程碑完成', message: `"${m.name}" 已成功完成`, type: 'success', duration: 3000 })
}
export const checkAndSendMilestoneNotifications = (milestones: Milestone[]) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const next7 = new Date(today); next7.setDate(next7.getDate() + 7)
  milestones.forEach(m => {
    if (m.status === 'completed') return
    const d = new Date(m.plannedDate); d.setHours(0,0,0,0)
    if (d < today) sendMilestoneDelayedNotification(m)
    else if (d <= next7) sendMilestoneDueNotification(m)
  })
}
let _timer: number | null = null
export const startMilestoneNotificationCheck = (milestones: Milestone[], interval = 60000) => {
  if (_timer) clearInterval(_timer)
  checkAndSendMilestoneNotifications(milestones)
  _timer = window.setInterval(() => checkAndSendMilestoneNotifications(milestones), interval)
}
export const stopMilestoneNotificationCheck = () => { if (_timer) { clearInterval(_timer); _timer = null } }