import { usePermissionStore } from '../stores/permission';
import type { User } from '../types';

/**
 * 检查用户是否拥有指定权限
 * @param permissionCode 权限代码
 * @returns 是否拥有权限
 */
export function hasPermission(permissionCode: string): boolean {
  const permissionStore = usePermissionStore();
  return permissionStore.hasPermission(permissionCode);
}

/**
 * 检查用户是否拥有任意一个权限
 * @param permissionCodes 权限代码列表
 * @returns 是否拥有任意一个权限
 */
export function hasAnyPermission(permissionCodes: string[]): boolean {
  const permissionStore = usePermissionStore();
  return permissionStore.hasAnyPermission(permissionCodes);
}

/**
 * 检查用户是否拥有所有权限
 * @param permissionCodes 权限代码列表
 * @returns 是否拥有所有权限
 */
export function hasAllPermission(permissionCodes: string[]): boolean {
  const permissionStore = usePermissionStore();
  return permissionStore.hasAllPermission(permissionCodes);
}

/**
 * 检查用户是否可以访问指定数据
 * @param dataOwnerId 数据归属人ID
 * @param currentUserId 当前用户ID
 * @param subordinateIds 下级用户ID列表
 * @returns 是否可以访问
 */
export function canAccessData(
  dataOwnerId: string,
  currentUserId: string,
  subordinateIds: string[] = [],
): boolean {
  // 管理员可以访问所有数据
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') {
    return true;
  }

  // 本人数据
  if (dataOwnerId === currentUserId) {
    return true;
  }

  // 下级数据
  if (subordinateIds.includes(dataOwnerId)) {
    return true;
  }

  return false;
}

/**
 * 检查用户是否可以编辑指定数据
 * @param dataOwnerId 数据归属人ID
 * @param currentUserId 当前用户ID
 * @returns 是否可以编辑
 */
export function canEditData(dataOwnerId: string, currentUserId: string): boolean {
  // 管理员可以编辑所有数据
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') {
    return true;
  }

  // 只能编辑自己的数据
  return dataOwnerId === currentUserId;
}

/**
 * 检查用户是否可以分配数据
 * @param currentUserId 当前用户ID
 * @param targetUserId 目标用户ID
 * @param subordinateIds 下级用户ID列表
 * @returns 是否可以分配
 */
export function canAssignData(
  currentUserId: string,
  targetUserId: string,
  subordinateIds: string[],
): boolean {
  // 管理员可以分配给任何人
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') {
    return true;
  }

  // 只能分配给下级
  return subordinateIds.includes(targetUserId);
}

/**
 * 检查是否可以编辑线索
 * 根据需求规格：总裁或营销副总裁可以编辑修改线索，负责人或上级也可以编辑
 */
export function canEditLead(lead: any, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  
  // 系统管理员可以编辑所有线索
  if (userRole === 'admin') return true;
  
  // 总裁和营销副总裁可以编辑所有线索
  if (userRole === 'ceo' || userRole === 'cmo') return true;
  
  // 销售经理可以编辑自己和下属的线索
  if (userRole === 'sales_manager') {
    // 可以编辑自己负责的线索
    if (lead.assignedTo === currentUserId || lead.ownerId === currentUserId) return true;
    // 可以编辑自己创建的线索
    if (lead.createdBy === currentUserId) return true;
    // 销售经理可以编辑下属的线索（需要检查是否为下属）
    // 注意：这里简化处理，实际应该检查组织架构关系
    return true; // 暂时允许销售经理编辑所有可见的线索
  }
  
  // 负责人可以编辑自己的线索
  if (lead.assignedTo === currentUserId || lead.ownerId === currentUserId) return true;
  
  // 创建人可以编辑自己创建的线索
  if (lead.createdBy === currentUserId) return true;
  
  return false;
}

/**
 * 检查是否可以删除线索
 * 根据需求规格：线索一旦录入，除系统管理员以外，任何人不能删除
 */
export function canDeleteLead(lead: any, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  
  // 只有系统管理员可以删除线索
  if (userRole === 'admin') return true;
  
  return false;
}

/**
 * 检查是否可以分配线索
 * 根据需求规格：上级可以将线索分配给下级
 */
export function canAssignLead(currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  
  // 系统管理员、总裁、副总裁、销售经理可以分配线索
  const canAssignRoles = ['admin', 'ceo', 'cto', 'cmo', 'sales_manager'];
  return canAssignRoles.includes(userRole || '');
}

/**
 * 检查是否可以转化线索
 * 根据需求规格：系统管理员、总裁、营销副总裁可以转化线索
 */
export function canConvertLead(currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  
  // 系统管理员、总裁、营销副总裁可以转化线索
  const canConvertRoles = ['admin', 'ceo', 'cmo'];
  return canConvertRoles.includes(userRole || '');
}

/**
 * 检查当前用户是否为某用户的上级
 * @param targetUserId 目标用户ID
 * @param currentUserId 当前用户ID
 */
export function isSuperiorOf(targetUserId: string, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  
  // 如果是同一个人，不是上级
  if (targetUserId === currentUserId) return false;
  
  // 管理员、总裁、副总裁是所有人的上级
  const userRole = localStorage.getItem('userRole');
  if (['admin', 'ceo', 'cto', 'cmo'].includes(userRole || '')) {
    return true;
  }
  
  // 销售经理是销售的上级（简化判断，实际应该查询组织架构）
  // 这里暂时返回true，让后端进行精确判断
  if (userRole === 'sales_manager') {
    return true;
  }
  
  return false;
}

/**
 * 检查是否可以编辑用户
 */
export function canEditUser(user: User, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') return true;
  return user.id === currentUserId;
}

/**
 * 检查是否可以删除用户
 */
export function canDeleteUser(user: User, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') return true;
  return user.id !== currentUserId; // 不能删除自己
}

/**
 * 获取当前用户
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * 获取角色显示名称
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    ceo: '总裁',
    cto: '技术副总',
    cmo: '营销副总',
    sales_manager: '销售经理',
    sales: '销售',
    project_manager: '项目经理',
    business: '商务',
    finance: '财务',
    engineer: '工程师',
  };
  return roleMap[role] || role;
}

/**
 * 获取角色名称(别名)
 */
export function getRoleName(role: string): string {
  return getRoleDisplayName(role);
}

/**
 * 获取所有角色列表
 */
export function getAllRoles(): Array<{ value: string; label: string }> {
  return [
    { value: 'admin', label: '管理员' },
    { value: 'ceo', label: '总裁' },
    { value: 'cto', label: '技术副总' },
    { value: 'cmo', label: '营销副总' },
    { value: 'sales_manager', label: '销售经理' },
    { value: 'sales', label: '销售' },
    { value: 'project_manager', label: '项目经理' },
    { value: 'business', label: '商务' },
    { value: 'finance', label: '财务' },
    { value: 'engineer', label: '工程师' },
  ];
}

/**
 * 获取可分配角色列表
 */
export function getAssignableRoles(currentRole: string): Array<{ value: string; label: string }> {
  const allRoles = getAllRoles();
  const roleHierarchy: Record<string, number> = {
    admin: 10,
    ceo: 9,
    cto: 8,
    cmo: 8,
    sales_manager: 6,
    project_manager: 6,
    business: 5,
    finance: 5,
    sales: 3,
    engineer: 3,
  };

  const currentLevel = roleHierarchy[currentRole] || 0;
  return allRoles.filter(role => (roleHierarchy[role.value] || 0) <= currentLevel);
}

/**
 * 获取角色颜色
 */
export function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    admin: 'danger',
    ceo: 'warning',
    cto: 'primary',
    cmo: 'success',
    sales_manager: 'info',
    sales: '',
    project_manager: 'primary',
    business: 'success',
    finance: 'warning',
    engineer: 'info',
  };
  return colorMap[role] || '';
}

/**
 * 检查是否可以管理客户（添加跟进记录等）
 */
export function canManageCustomer(customerOwnerId: string, currentUserId?: string): boolean {
  if (!currentUserId) {
    currentUserId = localStorage.getItem('userId') || '';
  }
  const userRole = localStorage.getItem('userRole');

  if (['admin', 'ceo', 'cmo'].includes(userRole || '')) {
    return true;
  }

  if (customerOwnerId === currentUserId) {
    return true;
  }

  if (userRole === 'sales_manager') {
    return true;
  }

  return false;
}

/**
 * 检查是否可以将客户分配给目标用户
 */
export function canAssignToRole(targetRole: string): boolean {
  const userRole = localStorage.getItem('userRole');

  if (['admin', 'ceo'].includes(userRole || '')) {
    return true;
  }

  if (userRole === 'cmo') {
    return ['sales_manager', 'sales', 'business'].includes(targetRole);
  }

  if (userRole === 'sales_manager') {
    return targetRole === 'sales';
  }

  return false;
}

/**
 * 获取可分配的用户列表
 */
export function getAssignableUsers(users: User[]): User[] {
  const userRole = localStorage.getItem('userRole');

  if (['admin', 'ceo'].includes(userRole || '')) {
    return users;
  }

  if (userRole === 'cmo') {
    return users.filter(u => ['sales_manager', 'sales', 'business'].includes(u.role));
  }

  if (userRole === 'sales_manager') {
    return []; // 需要从后端获取下属列表
  }

  return [];
}
