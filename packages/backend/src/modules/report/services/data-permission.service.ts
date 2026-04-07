import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class DataPermissionService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * 构建数据权限过滤条件
   * @param user 当前用户
   * @param resourceType 资源类型
   * @returns 权限过滤条件
   */
  async buildPermissionFilter(
    user: User,
    resourceType: 'opportunity' | 'contract' | 'project' | 'customer' | 'lead'
  ): Promise<FindOptionsWhere<any>> {
    // 管理员角色返回空过滤条件(全部数据)
    if (this.isAdminRole(user.role)) {
      return {};
    }

    // 销售经理返回本人+下属的过滤条件
    if (this.isManagerRole(user.role)) {
      const userIds = await this.getSubordinates(user.id);
      userIds.push(user.id);
      return { ownerId: In(userIds) };
    }

    // 项目经理返回负责项目的过滤条件
    if (resourceType === 'project' && this.isProjectManager(user.role)) {
      return { manager: user.id };
    }

    // 普通销售返回仅本人的过滤条件
    return { ownerId: user.id };
  }

  /**
   * 获取下属用户ID列表(递归查询)
   * @param userId 用户ID
   * @returns 下属用户ID列表
   */
  private async getSubordinates(userId: string): Promise<string[]> {
    const subordinates = await this.userRepo.find({
      where: { superiorId: userId },
      select: ['id'],
    });

    const subordinateIds = subordinates.map(u => u.id);
    
    // 递归查询下属的下属
    for (const id of subordinateIds) {
      const nestedSubordinates = await this.getSubordinates(id);
      subordinateIds.push(...nestedSubordinates);
    }

    return subordinateIds;
  }

  /**
   * 判断是否管理员角色
   * @param role 角色代码
   * @returns 是否管理员
   */
  private isAdminRole(role: string): boolean {
    return ['admin', 'ceo', 'cto', 'cmo', 'cfo'].includes(role);
  }

  /**
   * 判断是否经理角色
   * @param role 角色代码
   * @returns 是否经理
   */
  private isManagerRole(role: string): boolean {
    return ['sales_manager', 'sales_director', 'vp_sales'].includes(role);
  }

  /**
   * 判断是否项目经理角色
   * @param role 角色代码
   * @returns 是否项目经理
   */
  private isProjectManager(role: string): boolean {
    return ['project_manager', 'pmo', 'project_director'].includes(role);
  }

  /**
   * 获取用户可访问的用户ID列表
   * @param user 当前用户
   * @returns 可访问的用户ID列表
   */
  async getAccessibleUserIds(user: User): Promise<string[]> {
    if (this.isAdminRole(user.role)) {
      // 管理员可访问所有用户
      const allUsers = await this.userRepo.find({ select: ['id'] });
      return allUsers.map(u => u.id);
    }

    if (this.isManagerRole(user.role)) {
      // 经理可访问本人和下属
      const userIds = await this.getSubordinates(user.id);
      userIds.push(user.id);
      return userIds;
    }

    // 普通用户只能访问自己
    return [user.id];
  }

  /**
   * 检查用户是否有权限访问指定资源
   * @param user 当前用户
   * @param resourceOwnerId 资源所有者ID
   * @returns 是否有权限
   */
  async hasPermission(user: User, resourceOwnerId: string): Promise<boolean> {
    if (this.isAdminRole(user.role)) {
      return true;
    }

    const accessibleUserIds = await this.getAccessibleUserIds(user);
    return accessibleUserIds.includes(resourceOwnerId);
  }
}
