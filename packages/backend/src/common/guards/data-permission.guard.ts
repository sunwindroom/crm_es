import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DATA_PERMISSION_KEY } from '../decorators/data-permission.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/user/entities/user.entity';

@Injectable()
export class DataPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取资源名称
    const resource = this.reflector.get<string>(DATA_PERMISSION_KEY, context.getHandler());

    // 如果没有标记数据权限，则放行
    if (!resource) {
      return true;
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 系统管理员拥有所有数据权限
    if (user.role === 'admin') {
      return true;
    }

    // 获取目标数据ID
    const targetId = request.params.id;

    if (!targetId) {
      // 如果没有指定ID，则是列表查询，由拦截器处理
      return true;
    }

    // 获取目标数据
    const entity = await this.getEntity(resource, targetId);

    if (!entity) {
      throw new ForbiddenException('数据不存在');
    }

    // 检查数据权限：本人或下级的数据
    const subordinateIds = await this.getSubordinateIds(user.id);
    const allowedIds = [user.id, ...subordinateIds];

    if (!allowedIds.includes(entity.owner_id || entity.created_by)) {
      throw new ForbiddenException('无权访问该数据');
    }

    return true;
  }

  /**
   * 获取实体数据
   * @param resource 资源名称
   * @param id 实体ID
   */
  private async getEntity(resource: string, id: string): Promise<any> {
    // 这里需要根据资源名称动态获取实体
    // 简化实现，实际应该使用动态查询
    return { id, owner_id: null, created_by: null };
  }

  /**
   * 递归获取所有下级用户ID
   * @param userId 用户ID
   */
  private async getSubordinateIds(userId: string): Promise<string[]> {
    const subordinates = await this.userRepository.find({
      where: { superiorId: userId },
      select: ['id'],
    });

    const subordinateIds = subordinates.map((u) => u.id);

    // 递归获取下级的下级
    for (const subordinateId of subordinateIds) {
      const childIds = await this.getSubordinateIds(subordinateId);
      subordinateIds.push(...childIds);
    }

    return subordinateIds;
  }
}
