import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../modules/user/entities/user.entity';
import { ROLES_KEY } from '../decorators/require-role.decorator';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction, AuditResource } from '../../modules/audit/entities/audit-log.entity';

/**
 * 角色守卫
 * 检查用户是否拥有所需的角色
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取所需的角色列表
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置角色要求，则允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取请求对象
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果用户未登录，拒绝访问
    if (!user) {
      await this.logPermissionDenied(request, '用户未登录');
      throw new ForbiddenException('用户未登录');
    }

    // 检查用户角色是否在允许的角色列表中
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      await this.logPermissionDenied(
        request,
        `用户角色 ${user.role} 不在允许的角色列表 [${requiredRoles.join(', ')}] 中`,
      );
      throw new ForbiddenException(
        `无权访问该资源，需要角色：${requiredRoles.join(' 或 ')}`,
      );
    }

    return true;
  }

  /**
   * 记录权限校验失败日志
   */
  private async logPermissionDenied(request: any, reason: string): Promise<void> {
    try {
      await this.auditLogService.log({
        userId: request.user?.id || 'unknown',
        action: AuditAction.PERMISSION_DENIED,
        resource: AuditResource.PERMISSION,
        resourceId: 'role_check',
        remark: reason,
        ip: request.ip || request.connection?.remoteAddress || 'unknown',
        userAgent: request.headers['user-agent'] || 'unknown',
      });
    } catch (error) {
      // 记录日志失败不影响主流程
      console.error('记录审计日志失败:', error);
    }
  }
}
