/**
 * 根据归属人过滤数据
 * @param dataList 数据列表
 * @param currentUserId 当前用户ID
 * @param subordinateIds 下级用户ID列表
 * @returns 过滤后的数据列表
 */
export function filterByOwner<T extends { owner_id?: string; created_by?: string; assigned_to?: string }>(
  dataList: T[],
  currentUserId: string,
  subordinateIds: string[] = [],
): T[] {
  // 管理员可以查看所有数据
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') {
    return dataList;
  }

  // 允许的用户ID列表
  const allowedIds = [currentUserId, ...subordinateIds];

  // 过滤数据
  return dataList.filter((item) => {
    const ownerId = item.owner_id || item.created_by || item.assigned_to;
    return allowedIds.includes(ownerId);
  });
}

/**
 * 检查用户是否可以编辑数据
 * @param dataOwnerId 数据归属人ID
 * @param currentUserId 当前用户ID
 * @returns 是否可以编辑
 */
export function canEdit(dataOwnerId: string, currentUserId: string): boolean {
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
export function canAssign(
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
 * 检查用户是否可以删除数据
 * @param dataOwnerId 数据归属人ID
 * @param currentUserId 当前用户ID
 * @returns 是否可以删除
 */
export function canDelete(dataOwnerId: string, currentUserId: string): boolean {
  // 管理员可以删除所有数据
  const userRole = localStorage.getItem('userRole');
  if (userRole === 'admin') {
    return true;
  }

  // 只能删除自己的数据
  return dataOwnerId === currentUserId;
}
