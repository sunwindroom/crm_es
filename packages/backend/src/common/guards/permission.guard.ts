import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../modules/role/entities/role.entity';
import { Permission } from '../../modules/role/entities/permission.entity';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取接口所需的权限
    const requiredPermission = this.reflector.get<string>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );

    // 如果没有标记权限，则放行
    if (!requiredPermission) {
      return true;
    }

    // 获取当前用户
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    // 系统管理员拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    // 检查用户是否拥有所需权限
    const hasPermission = await this.checkPermission(user.roleId, requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }

  /**
   * 检查用户是否拥有指定权限
   * @param roleId 角色ID
   * @param permissionCode 权限代码
   */
  private async checkPermission(roleId: string, permissionCode: string): Promise<boolean> {
    if (!roleId) {
      return false;
    }

    // 查询角色及其权限
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissionsList'],
    });

    if (!role || !role.permissionsList) {
      return false;
    }

    // 检查权限列表中是否包含所需权限
    return role.permissionsList.some((permission) => permission.code === permissionCode);
  }
}
