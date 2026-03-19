import { useAuthStore } from '@/stores/auth'
import type { User, UserRole, Permission } from '@/types'

/**
 * 角色权限配置映射
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'lead_create','lead_view','lead_edit','lead_delete','lead_assign','lead_convert',
    'customer_create','customer_view','customer_edit','customer_delete',
    'project_create','project_view','project_edit','project_delete',
    'contract_create','contract_view','contract_edit','contract_delete',
    'payment_create','payment_view','payment_edit','payment_delete',
    'user_create','user_view','user_edit','user_delete',
    'role_view','role_edit','report_view','dashboard_view'
  ],
  ceo: [
    'lead_create','lead_view','lead_edit','lead_delete','lead_assign','lead_convert',
    'customer_create','customer_view','customer_edit','customer_delete',
    'project_create','project_view','project_edit','project_delete',
    'contract_create','contract_view','contract_edit','contract_delete',
    'payment_create','payment_view','payment_edit','payment_delete',
    'user_view','role_view','report_view','dashboard_view'
  ],
  cto: [
    'lead_view','customer_view',
    'project_create','project_view','project_edit','project_delete',
    'contract_view','payment_view','user_view','report_view','dashboard_view'
  ],
  cmo: [
    'lead_create','lead_view','lead_edit','lead_delete','lead_assign','lead_convert',
    'customer_create','customer_view','customer_edit','customer_delete',
    'project_view','contract_create','contract_view','contract_edit',
    'payment_view','user_view','report_view','dashboard_view'
  ],
  sales_manager: [
    'lead_create','lead_view','lead_edit','lead_delete','lead_assign','lead_convert',
    'customer_create','customer_view','customer_edit','customer_delete',
    'project_view','contract_view','payment_view','report_view','dashboard_view'
  ],
  sales: [
    'lead_create','lead_view','lead_edit','lead_convert',
    'customer_create','customer_view','customer_edit',
    'project_view','contract_view','payment_view','dashboard_view'
  ],
  project_manager: [
    'lead_view','customer_view',
    'project_create','project_view','project_edit',
    'contract_view','payment_view','dashboard_view'
  ],
  business: [
    'lead_create','lead_view','lead_edit','lead_convert',
    'customer_create','customer_view','customer_edit',
    'project_view','contract_view','payment_view','report_view','dashboard_view'
  ],
  finance: [
    'lead_view','customer_view','project_view',
    'contract_create','contract_view','contract_edit',
    'payment_create','payment_view','payment_edit',
    'report_view','dashboard_view'
  ]
}

/**
 * 角色层级（数字越大级别越高）
 */
const roleHierarchy: Record<UserRole, number> = {
  admin: 100, ceo: 90, cto: 80, cmo: 80,
  sales_manager: 60, project_manager: 50,
  sales: 40, business: 30, finance: 30
}

/**
 * 角色显示名称
 */
const roleNames: Record<UserRole, string> = {
  admin: '管理员', ceo: '总裁', cto: '技术副总', cmo: '营销副总',
  sales_manager: '销售经理', sales: '销售', project_manager: '项目经理',
  business: '商务', finance: '财务'
}

/**
 * 角色颜色（Element Plus tag 类型）
 */
const roleColors: Record<UserRole, string> = {
  admin: 'danger', ceo: 'danger', cto: 'warning', cmo: 'warning',
  sales_manager: 'primary', sales: 'success', project_manager: 'primary',
  business: 'info', finance: 'info'
}

// ============================================================
// 基础工具函数
// ============================================================

export const getCurrentUser = (): User | null => {
  const authStore = useAuthStore()
  return authStore.user as User | null
}

export const getCurrentUserRole = (): UserRole => {
  const user = getCurrentUser()
  return (user?.role as UserRole) || 'sales'
}

export const getRoleLevel = (role: UserRole): number => roleHierarchy[role] || 0

export const getRoleDisplayName = (role: UserRole | string): string =>
  roleNames[role as UserRole] || String(role)

export const getRoleColor = (role: UserRole | string): string =>
  roleColors[role as UserRole] || 'info'

export const getAllRoles = (): Array<{ value: UserRole; label: string; color: string }> =>
  (Object.keys(roleNames) as UserRole[]).map(role => ({
    value: role, label: roleNames[role], color: roleColors[role]
  }))

// ============================================================
// 权限检查函数
// ============================================================

export const hasPermission = (permission: Permission | string): boolean => {
  const user = getCurrentUser()
  if (!user) return false
  const perms = rolePermissions[user.role as UserRole] || []
  return perms.includes(permission as Permission)
}

export const hasAnyPermission = (permissions: Permission[]): boolean =>
  permissions.some(p => hasPermission(p))

export const hasAllPermissions = (permissions: Permission[]): boolean =>
  permissions.every(p => hasPermission(p))

// ============================================================
// 里程碑权限检查
// ============================================================

export const canManageMilestone = (): boolean =>
  hasAnyPermission(['project_edit', 'project_create'])

export const canCreateMilestone = (): boolean =>
  hasPermission('project_edit')

export const canEditMilestone = (assigneeId?: string): boolean => {
  if (hasPermission('project_delete')) return true // admin/ceo/cto
  const user = getCurrentUser()
  if (!user) return false
  if (hasPermission('project_edit')) return true
  // 负责人自己可以编辑
  return assigneeId === user.id
}

export const canDeleteMilestone = (assigneeId?: string): boolean => {
  if (!hasPermission('project_edit')) return false
  const user = getCurrentUser()
  if (!user) return false
  if (['admin','ceo','cto','cmo'].includes(user.role)) return true
  return assigneeId === user.id
}

export const canStartMilestone = (assigneeId?: string): boolean => {
  if (!hasPermission('project_view')) return false
  const user = getCurrentUser()
  if (!user) return false
  if (['admin','ceo','cto','cmo','project_manager','sales_manager'].includes(user.role)) return true
  return assigneeId === user.id
}

export const canCompleteMilestone = (assigneeId?: string): boolean =>
  canStartMilestone(assigneeId)

export const canDelayMilestone = (assigneeId?: string): boolean => {
  if (!hasPermission('project_edit')) return false
  const user = getCurrentUser()
  if (!user) return false
  if (['admin','ceo','cto','cmo'].includes(user.role)) return true
  return assigneeId === user.id
}

// ============================================================
// 用户管理权限
// ============================================================

export const canManageUsers = (): boolean =>
  hasAnyPermission(['user_create', 'user_edit'])

export const canManageRoles = (): boolean =>
  hasPermission('role_edit')

export const canEditUser = (targetUser: User): boolean => {
  const currentUser = getCurrentUser()
  if (!currentUser) return false
  if (currentUser.id === targetUser.id) return true // 自己
  if (!canManageUsers()) return false
  // 只能编辑级别比自己低的用户
  return getRoleLevel(currentUser.role as UserRole) > getRoleLevel(targetUser.role as UserRole)
}

export const canDeleteUser = (targetUser: User): boolean => {
  const currentUser = getCurrentUser()
  if (!currentUser || currentUser.id === targetUser.id) return false
  if (targetUser.role === 'admin') return false // 不能删除管理员
  return canEditUser(targetUser) && hasPermission('user_delete')
}

// ============================================================
// 线索权限检查
// ============================================================

export const canEditLead = (lead: any): boolean => {
  if (!hasPermission('lead_edit')) return false
  const user = getCurrentUser()
  if (!user) return false
  if (['admin','ceo','cto','cmo'].includes(user.role)) return true
  if (['business','finance'].includes(user.role)) return false
  if (user.role === 'sales_manager') {
    return lead.assignedTo === user.id || lead.createdBy === user.id ||
           (user.subordinateIds?.includes(lead.assignedTo) ?? false)
  }
  return lead.assignedTo === user.id || lead.createdBy === user.id
}

export const canDeleteLead = (lead: any): boolean => {
  if (!hasPermission('lead_delete')) return false
  const user = getCurrentUser()
  if (!user) return false
  if (['admin','ceo','cmo'].includes(user.role)) return true
  if (user.role === 'sales_manager') {
    return lead.createdBy === user.id ||
           (user.subordinateIds?.includes(lead.assignedTo) ?? false)
  }
  return lead.createdBy === user.id
}

export const filterLeadsByPermission = (leads: any[]): any[] => {
  const user = getCurrentUser()
  if (!user) return []
  if (['admin','ceo','cto','cmo','business','finance'].includes(user.role)) return leads
  if (user.role === 'sales_manager') {
    const userIds = [user.id, ...(user.subordinateIds || [])]
    return leads.filter(l => userIds.includes(l.assignedTo) || userIds.includes(l.createdBy))
  }
  return leads.filter(l => l.assignedTo === user.id || l.createdBy === user.id)
}

// ============================================================
// 分配权限
// ============================================================

export const canAssignToRole = (targetRole: UserRole): boolean => {
  const user = getCurrentUser()
  if (!user) return false
  const current = user.role as UserRole
  if (current === 'admin') return true
  if (current === 'ceo') return targetRole !== 'admin'
  if (current === 'cmo' || current === 'cto') {
    return !['admin','ceo'].includes(targetRole) && targetRole !== 'project_manager'
  }
  if (current === 'sales_manager') return targetRole === 'sales'
  return false
}

export const getAssignableRoles = (): UserRole[] =>
  (Object.keys(roleNames) as UserRole[]).filter(r => canAssignToRole(r))
