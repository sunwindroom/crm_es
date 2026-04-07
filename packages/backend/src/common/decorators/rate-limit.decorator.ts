import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RATE_WINDOW_KEY = 'rateWindow';

/**
 * 限流装饰器
 * @param limit 限流次数
 * @param window 时间窗口(秒)
 */
export const RateLimit = (limit: number, window: number = 60) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(RATE_LIMIT_KEY, limit)(target, propertyKey, descriptor);
    SetMetadata(RATE_WINDOW_KEY, window)(target, propertyKey, descriptor);
  };
};
