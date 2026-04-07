import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface Permission {
  id: string;
  name: string;
  code: string;
  resource: string;
  action: string;
  description?: string;
}

export const usePermissionStore = defineStore('permission', () => {
  // 状态
  const permissions = ref<Permission[]>([]);
  const loading = ref(false);

  // 计算属性
  const permissionCodes = computed(() => {
    return permissions.value.map((p) => p.code);
  });

  // 方法
  /**
   * 设置权限列表
   */
  function setPermissions(permissionList: Permission[]) {
    permissions.value = permissionList;
  }

  /**
   * 转换权限码格式
   * 支持两种格式：customer:create 和 customer_create
   */
  function getAlternativeCode(permissionCode: string): string {
    if (permissionCode.includes(':')) {
      // customer:create -> customer_create
      return permissionCode.replace(':', '_');
    } else if (permissionCode.includes('_')) {
      // customer_create -> customer:create
      const parts = permissionCode.split('_');
      if (parts.length >= 2) {
        const action = parts.pop();
        return `${parts.join('_')}:${action}`;
      }
    }
    return permissionCode;
  }

  /**
   * 检查是否拥有指定权限
   * 支持两种权限码格式
   */
  function hasPermission(permissionCode: string): boolean {
    // 管理员拥有所有权限
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      return true;
    }

    // 检查新格式权限码
    if (permissionCodes.value.includes(permissionCode)) {
      return true;
    }

    // 检查旧格式权限码
    const alternativeCode = getAlternativeCode(permissionCode);
    if (permissionCodes.value.includes(alternativeCode)) {
      return true;
    }

    // 对于特定角色，根据角色直接判断权限
    return hasPermissionByRole(permissionCode);
  }

  /**
   * 根据角色直接判断权限
   * 用于兼容旧的角色权限系统
   */
  function hasPermissionByRole(permissionCode: string): boolean {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return false;

    // 提取资源和操作
    let resource: string;
    let action: string;

    if (permissionCode.includes(':')) {
      [resource, action] = permissionCode.split(':');
    } else if (permissionCode.includes('_')) {
      const parts = permissionCode.split('_');
      action = parts.pop() || '';
      resource = parts.join('_');
    } else {
      return false;
    }

    // 总裁权限
    if (userRole === 'ceo') {
      const ceoPermissions = [
        'lead', 'customer', 'opportunity', 'project', 'contract', 'payment', 'follow_up'
      ];
      if (ceoPermissions.includes(resource)) {
        return ['view', 'create', 'edit', 'delete', 'assign', 'convert'].includes(action);
      }
    }

    // 营销副总裁权限
    if (userRole === 'cmo') {
      const cmoPermissions = ['lead', 'customer', 'opportunity', 'contract', 'follow_up'];
      if (cmoPermissions.includes(resource)) {
        return ['view', 'create', 'edit', 'assign', 'convert'].includes(action);
      }
    }

    // 销售经理权限
    if (userRole === 'sales_manager') {
      const smPermissions = ['lead', 'customer', 'opportunity', 'follow_up'];
      if (smPermissions.includes(resource)) {
        return ['view', 'create', 'edit', 'assign'].includes(action);
      }
    }

    // 销售权限
    if (userRole === 'sales') {
      const salesPermissions = ['lead', 'customer', 'opportunity', 'follow_up'];
      if (salesPermissions.includes(resource)) {
        return ['view', 'create', 'edit', 'convert'].includes(action);
      }
    }

    return false;
  }

  /**
   * 检查是否拥有任意一个权限
   */
  function hasAnyPermission(permissionCodes: string[]): boolean {
    return permissionCodes.some((code) => hasPermission(code));
  }

  /**
   * 检查是否拥有所有权限
   */
  function hasAllPermission(permissionCodes: string[]): boolean {
    return permissionCodes.every((code) => hasPermission(code));
  }

  /**
   * 清空权限
   */
  function clearPermissions() {
    permissions.value = [];
  }

  return {
    permissions,
    loading,
    permissionCodes,
    setPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermission,
    clearPermissions,
  };
});
