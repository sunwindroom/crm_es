import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// 简单的内存缓存实现
class SimpleCache {
  private store = new Map<string, { value: string; expireAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    this.store.set(key, { value, expireAt: Date.now() + ttl * 1000 });
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly defaultLimit = 100; // 默认限制: 100次/分钟
  private readonly defaultWindow = 60; // 默认窗口: 60秒
  private readonly cache = new SimpleCache();

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 获取自定义限流配置
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || this.defaultLimit;
    const window = this.reflector.get<number>('rateWindow', context.getHandler()) || this.defaultWindow;

    // 生成限流键
    const key = this.generateRateLimitKey(request);

    // 获取当前计数
    const current = await this.getRateLimitCount(key);

    if (current >= limit) {
      this.logger.warn(`Rate limit exceeded for ${key}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '请求过于频繁,请稍后再试',
          limit,
          window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 增加计数
    await this.incrementRateLimitCount(key, window);

    // 设置响应头
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current - 1));
    response.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + window);

    return true;
  }

  private generateRateLimitKey(request: any): string {
    const ip = request.ip || request.connection.remoteAddress;
    const route = request.route?.path || request.url;
    return `rate_limit:${ip}:${route}`;
  }

  private async getRateLimitCount(key: string): Promise<number> {
    try {
      const value = await this.cache.get(key);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      this.logger.error(`Get rate limit count error: ${error.message}`);
      return 0;
    }
  }

  private async incrementRateLimitCount(key: string, ttl: number): Promise<void> {
    try {
      const current = await this.getRateLimitCount(key);
      await this.cache.set(key, (current + 1).toString(), ttl);
    } catch (error) {
      this.logger.error(`Increment rate limit count error: ${error.message}`);
    }
  }
}
