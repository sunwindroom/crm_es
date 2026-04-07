import { SetMetadata } from '@nestjs/common';

export const DATA_PERMISSION_KEY = 'data_permission';

/**
 * 数据权限装饰器
 * 用于标记需要数据权限控制的接口
 * @param resource 资源名称
 */
export const DataPermission = (resource: string) => SetMetadata(DATA_PERMISSION_KEY, resource);
