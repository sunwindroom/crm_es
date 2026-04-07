import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../../modules/user/entities/user.entity';
import { PermissionCacheService } from './permission-cache.service';
import { Project } from '../../modules/project/entities/project.entity';
import { ProjectMember } from '../../modules/project/entities/project-member.entity';

@Injectable()
export class DataPermissionService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private memberRepository: Repository<ProjectMember>,
    private permissionCacheService: PermissionCacheService,
  ) {}

  /**
   * 可以查看所有数据的角色列表
   * 包括：系统管理员、总裁、技术副总裁、营销副总裁、商务、财务
   */
  private readonly viewAllDataRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.CTO,
    UserRole.CMO,
    UserRole.BUSINESS,
    UserRole.FINANCE,
  ];

  /**
   * 可以编辑所有数据的角色列表
   * 包括：系统管理员、总裁、营销副总裁
   */
  private readonly editAllDataRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.CMO,
  ];

  /**
   * 可以删除数据的角色列表
   * 只有系统管理员可以删除
   */
  private readonly deleteDataRoles: UserRole[] = [
    UserRole.ADMIN,
  ];

  /**
   * 可以进行离职移交的角色列表
   * 包括：系统管理员、总裁、技术副总裁、营销副总裁
   */
  private readonly handoverRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.CTO,
    UserRole.CMO,
  ];

  /**
   * 销售相关角色
   */
  private readonly SALES_RELATED_ROLES: UserRole[] = [
    UserRole.SALES_MANAGER,
    UserRole.SALES,
    UserRole.BUSINESS,
  ];

  /**
   * 获取用户可以访问的数据范围（用户ID列表）
   * 包括自己和所有下级用户
   * 管理员返回空数组（不过滤）
   */
  async getAccessibleUserIds(userId: string): Promise<string[] | null> {
    // 尝试从缓存获取
    const cachedIds = await this.permissionCacheService.getAccessibleUserIds(userId);
    if (cachedIds !== undefined) {
      return cachedIds;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return [userId];
    }

    // 可以查看所有数据的角色，返回null表示不过滤
    if (this.viewAllDataRoles.includes(user.role)) {
      // 缓存结果
      await this.permissionCacheService.setAccessibleUserIds(userId, null);
      return null;
    }

    const accessibleIds = [userId];
    await this.addSubordinateIds(userId, accessibleIds);

    // 缓存结果
    await this.permissionCacheService.setAccessibleUserIds(userId, accessibleIds);

    return accessibleIds;
  }

  /**
   * 检查用户是否可以查看所有数据
   */
  async canViewAllData(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return this.viewAllDataRoles.includes(user.role);
  }

  /**
   * 检查用户是否可以编辑所有数据
   */
  async canEditAllData(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return this.editAllDataRoles.includes(user.role);
  }

  /**
   * 检查用户是否可以删除数据
   */
  async canDeleteData(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return this.deleteDataRoles.includes(user.role);
  }

  /**
   * 检查用户是否可以进行离职移交
   */
  async canHandover(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return this.handoverRoles.includes(user.role);
  }

  /**
   * 检查用户是否是销售相关角色（可以创建线索、客户、商机）
   */
  async isSalesRole(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return [
      UserRole.ADMIN,
      UserRole.CEO,
      UserRole.CMO,
      UserRole.SALES_MANAGER,
      UserRole.SALES,
    ].includes(user.role);
  }

  /**
   * 检查用户是否是项目相关角色（可以创建/管理项目）
   */
  async isProjectRole(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return [
      UserRole.ADMIN,
      UserRole.CEO,
      UserRole.CTO,
      UserRole.PROJECT_MANAGER,
      UserRole.BUSINESS,
    ].includes(user.role);
  }

  /**
   * 检查用户是否是财务角色
   */
  async isFinanceRole(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return [UserRole.ADMIN, UserRole.FINANCE].includes(user.role);
  }

  /**
   * 递归添加所有下级用户ID
   */
  private async addSubordinateIds(userId: string, ids: string[]): Promise<void> {
    const subordinates = await this.userRepository.find({
      where: { superiorId: userId },
      select: ['id'],
    });

    for (const subordinate of subordinates) {
      if (!ids.includes(subordinate.id)) {
        ids.push(subordinate.id);
        await this.addSubordinateIds(subordinate.id, ids);
      }
    }
  }

  /**
   * 检查用户是否有权限访问特定用户的数据
   */
  async canAccessData(userId: string, targetUserId: string): Promise<boolean> {
    const accessibleIds = await this.getAccessibleUserIds(userId);
    // 如果返回null，表示管理员，可以访问所有数据
    if (accessibleIds === null) {
      return true;
    }
    return accessibleIds.includes(targetUserId);
  }

  /**
   * 统一权限检查入口
   * @param userId 当前用户ID
   * @param action 操作类型：view/edit/delete/assign/convert
   * @param resourceOwnerId 资源负责人ID
   * @param targetUserId 目标用户ID（用于分配操作）
   */
  async canPerformAction(
    userId: string,
    action: 'view' | 'edit' | 'delete' | 'assign' | 'convert',
    resourceOwnerId?: string,
    targetUserId?: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    switch (action) {
      case 'view':
        // 查看权限：检查是否可以访问该数据
        if (resourceOwnerId) {
          return await this.canAccessData(userId, resourceOwnerId);
        }
        return true;

      case 'edit':
        // 编辑权限：负责人或上级或总裁/CMO
        if (this.editAllDataRoles.includes(user.role)) {
          return true;
        }
        if (resourceOwnerId) {
          // 检查是否为负责人
          if (userId === resourceOwnerId) {
            return true;
          }
          // 检查是否为上级
          const superiorIds = await this.getSuperiorIds(resourceOwnerId);
          return superiorIds.includes(userId);
        }
        return false;

      case 'delete':
        // 删除权限：仅系统管理员
        return this.deleteDataRoles.includes(user.role);

      case 'assign':
        // 分配权限：检查是否为目标用户的上级
        if (targetUserId) {
          const accessibleIds = await this.getAccessibleUserIds(userId);
          // 管理员可以分配给任何人
          if (accessibleIds === null) {
            return true;
          }
          // 检查目标用户是否在可访问范围内（即是否为下级）
          return accessibleIds.includes(targetUserId);
        }
        return false;

      case 'convert':
        // 转化权限：总裁或CMO
        return [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(user.role);

      default:
        return false;
    }
  }

  /**
   * 获取用户的所有上级ID列表
   */
  async getSuperiorIds(userId: string): Promise<string[]> {
    // 尝试从缓存获取
    const cachedIds = await this.permissionCacheService.getSuperiorIds(userId);
    if (cachedIds !== undefined) {
      return cachedIds;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.superiorId) {
      // 缓存空结果
      await this.permissionCacheService.setSuperiorIds(userId, []);
      return [];
    }

    const superiorIds: string[] = [];
    let currentSuperiorId = user.superiorId;

    while (currentSuperiorId) {
      if (superiorIds.includes(currentSuperiorId)) {
        break; // 防止循环
      }
      superiorIds.push(currentSuperiorId);

      const superior = await this.userRepository.findOne({
        where: { id: currentSuperiorId },
        select: ['superiorId'],
      });

      currentSuperiorId = superior?.superiorId;
    }

    // 缓存结果
    await this.permissionCacheService.setSuperiorIds(userId, superiorIds);

    return superiorIds;
  }

  /**
   * 检查用户是否可以将客户分配给目标用户
   * @param operatorUserId 操作用户ID
   * @param targetUserId 目标用户ID
   * @returns 是否可以分配
   */
  async canAssignToUser(operatorUserId: string, targetUserId: string): Promise<boolean> {
    const operator = await this.userRepository.findOne({ where: { id: operatorUserId } });
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });

    if (!operator || !targetUser) return false;

    // 1. 总裁和管理员可以分配给任何人
    if ([UserRole.ADMIN, UserRole.CEO].includes(operator.role)) {
      return true;
    }

    // 2. 营销副总裁可以分配给销售相关角色
    if (operator.role === UserRole.CMO) {
      return this.SALES_RELATED_ROLES.includes(targetUser.role);
    }

    // 3. 销售经理可以分配给下属
    if (operator.role === UserRole.SALES_MANAGER) {
      const subordinateIds = await this.getAccessibleUserIds(operatorUserId);
      return subordinateIds !== null && subordinateIds.includes(targetUserId);
    }

    return false;
  }

  /**
   * 检查用户是否有权限管理指定客户
   * @param userId 用户ID
   * @param customerOwnerId 客户负责人ID
   * @returns 是否可以管理
   */
  async canManageCustomer(userId: string, customerOwnerId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // 1. 总裁、管理员、CMO可以管理所有客户
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(user.role)) {
      return true;
    }

    // 2. 用户是客户负责人
    if (userId === customerOwnerId) {
      return true;
    }

    // 3. 用户是客户负责人的上级
    const superiorIds = await this.getSuperiorIds(customerOwnerId);
    return superiorIds.includes(userId);
  }

  /**
   * 获取用户可分配的目标用户ID列表
   * @param userId 用户ID
   * @returns 可分配的用户ID列表（null表示可分配给所有人）
   */
  async getAssignableUserIds(userId: string): Promise<string[] | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    // 1. 总裁和管理员可以分配给所有人
    if ([UserRole.ADMIN, UserRole.CEO].includes(user.role)) {
      return null;
    }

    // 2. 营销副总裁可以分配给销售相关角色
    if (user.role === UserRole.CMO) {
      const salesUsers = await this.userRepository.find({
        where: { role: In(this.SALES_RELATED_ROLES) },
        select: ['id'],
      });
      return salesUsers.map(u => u.id);
    }

    // 3. 销售经理可以分配给下属
    if (user.role === UserRole.SALES_MANAGER) {
      return await this.getAccessibleUserIds(userId);
    }

    return [];
  }

  /**
   * 检查用户是否是工程师角色
   */
  async isEngineer(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return user.role === UserRole.ENGINEER;
  }

  /**
   * 检查用户是否可以查看项目
   * 工程师只能查看自己参与的项目
   */
  async canViewProject(userId: string, projectId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    
    // 可以查看所有数据的角色
    if (this.viewAllDataRoles.includes(user.role)) {
      return true;
    }
    
    // 项目经理可以查看自己管理的项目
    if (user.role === UserRole.PROJECT_MANAGER) {
      const project = await this.projectRepository.findOne({
        where: { id: projectId, manager: userId },
      });
      if (project) return true;
    }
    
    // 检查是否是项目成员
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });
    return !!member;
  }

  /**
   * 获取用户可访问的项目ID列表
   * 用于项目列表查询时的权限过滤
   */
  async getAccessibleProjectIds(userId: string): Promise<string[] | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];
    
    // 可以查看所有数据的角色，返回null表示不过滤
    if (this.viewAllDataRoles.includes(user.role)) {
      return null;
    }
    
    // 获取用户管理的项目
    const managedProjects = await this.projectRepository.find({
      where: { manager: userId },
      select: ['id'],
    });
    
    // 获取用户参与的项目
    const memberProjects = await this.memberRepository.find({
      where: { userId },
      select: ['projectId'],
    });
    
    // 合并项目ID
    const projectIds = new Set<string>();
    managedProjects.forEach(p => projectIds.add(p.id));
    memberProjects.forEach(m => projectIds.add(m.projectId));
    
    return Array.from(projectIds);
  }

  /**
   * 检查用户是否可以分配项目经理
   * 只有CTO、Admin、CEO可以分配项目经理
   */
  async canAssignManager(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;
    return [UserRole.CTO, UserRole.ADMIN, UserRole.CEO].includes(user.role);
  }

  /**
   * 检查用户是否可以管理项目成员
   * CTO、Admin、CEO可以管理所有项目的成员
   * 项目经理只能管理自己项目的成员
   */
  async canManageMembers(userId: string, projectId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // CTO、Admin、CEO可以管理所有项目的成员
    if ([UserRole.CTO, UserRole.ADMIN, UserRole.CEO].includes(user.role)) {
      return true;
    }

    // 检查用户是否为该项目的项目经理
    const project = await this.projectRepository.findOne({
      where: { id: projectId, manager: userId },
    });
    return !!project;
  }

  /**
   * 检查用户是否可以查看项目成员列表
   * CTO、Admin、CEO可以查看所有项目的成员
   * 项目经理可以查看自己项目的成员
   * 项目成员可以查看自己参与项目的成员
   */
  async canViewProjectMembers(userId: string, projectId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    // CTO、Admin、CEO可以查看所有项目的成员
    if ([UserRole.CTO, UserRole.ADMIN, UserRole.CEO].includes(user.role)) {
      return true;
    }

    // 检查用户是否为该项目的项目经理
    const project = await this.projectRepository.findOne({
      where: { id: projectId, manager: userId },
    });
    if (project) return true;

    // 检查用户是否为该项目的成员
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });
    return !!member;
  }
}
