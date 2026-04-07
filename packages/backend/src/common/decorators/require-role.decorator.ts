import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/user/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * 用于标记接口所需的角色
 *
 * @example
 * // 单个角色
 * @RequireRole(UserRole.CEO)
 *
 * // 多个角色（OR逻辑）
 * @RequireRole([UserRole.CEO, UserRole.CMO])
 */
export const RequireRole = (roles: UserRole | UserRole[]) =>
  SetMetadata(ROLES_KEY, Array.isArray(roles) ? roles : [roles]);
