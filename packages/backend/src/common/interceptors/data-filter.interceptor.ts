import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataPermissionService } from '../services/data-permission.service';

/**
 * 数据过滤拦截器
 * 自动根据用户权限过滤数据
 */
@Injectable()
export class DataFilterInterceptor implements NestInterceptor {
  constructor(private dataPermissionService: DataPermissionService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果用户未登录，直接返回
    if (!user) {
      return next.handle();
    }

    // 获取用户可访问的用户ID列表
    const accessibleUserIds = await this.dataPermissionService.getAccessibleUserIds(user.id);

    // 将权限信息附加到请求对象，供后续使用
    request.dataPermission = {
      userId: user.id,
      accessibleUserIds,
      canViewAll: accessibleUserIds === null,
    };

    return next.handle().pipe(
      map((data) => {
        // 如果返回null，表示可以查看所有数据，不需要过滤
        if (accessibleUserIds === null) {
          return data;
        }

        // 如果数据是数组，进行过滤
        if (Array.isArray(data?.items)) {
          return {
            ...data,
            items: this.filterData(data.items, accessibleUserIds, user.id),
          };
        }

        // 如果数据是单个对象，检查权限
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const ownerId = this.getOwnerId(data);
          if (ownerId && !accessibleUserIds.includes(ownerId)) {
            return null; // 无权访问
          }
        }

        return data;
      }),
    );
  }

  /**
   * 过滤数据列表
   */
  private filterData(
    items: any[],
    accessibleUserIds: string[],
    currentUserId: string,
  ): any[] {
    return items.filter((item) => {
      const ownerId = this.getOwnerId(item);
      // 如果没有ownerId字段，默认允许访问
      if (!ownerId) {
        return true;
      }
      // 检查是否在可访问范围内
      return accessibleUserIds.includes(ownerId);
    });
  }

  /**
   * 获取数据的负责人ID
   * 支持多种字段名：assignedTo, ownerId, manager, createdBy
   */
  private getOwnerId(data: any): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    // 优先级：assignedTo > ownerId > manager > createdBy
    return data.assignedTo || data.ownerId || data.manager || data.createdBy || null;
  }
}
