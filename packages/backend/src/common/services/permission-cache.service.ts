import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { User, UserRole } from '../../modules/user/entities/user.entity';

/**
 * 权限缓存服务
 * 使用Redis缓存用户权限信息，提升权限查询性能
 */
@Injectable()
export class PermissionCacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly CACHE_TTL = 1800; // 30分钟
  private readonly KEY_PREFIX = 'crm:permission:';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      password: this.configService.get<string>('redis.password'),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * 生成缓存键
   */
  private getKey(type: string, userId: string): string {
    return `${this.KEY_PREFIX}${type}:${userId}`;
  }

  /**
   * 缓存用户可访问的用户ID列表
   */
  async setAccessibleUserIds(userId: string, ids: string[] | null): Promise<void> {
    const key = this.getKey('accessible_ids', userId);
    const value = ids === null ? 'null' : JSON.stringify(ids);
    await this.redis.setex(key, this.CACHE_TTL, value);
  }

  /**
   * 获取缓存的用户可访问的用户ID列表
   */
  async getAccessibleUserIds(userId: string): Promise<string[] | null | undefined> {
    const key = this.getKey('accessible_ids', userId);
    const value = await this.redis.get(key);

    if (value === null) {
      return undefined; // 缓存未命中
    }

    if (value === 'null') {
      return null; // 管理员，可查看所有数据
    }

    return JSON.parse(value);
  }

  /**
   * 缓存用户上级ID列表
   */
  async setSuperiorIds(userId: string, ids: string[]): Promise<void> {
    const key = this.getKey('superior_ids', userId);
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(ids));
  }

  /**
   * 获取缓存的用户上级ID列表
   */
  async getSuperiorIds(userId: string): Promise<string[] | undefined> {
    const key = this.getKey('superior_ids', userId);
    const value = await this.redis.get(key);

    if (value === null) {
      return undefined; // 缓存未命中
    }

    return JSON.parse(value);
  }

  /**
   * 缓存用户信息
   */
  async setUser(userId: string, user: User): Promise<void> {
    const key = this.getKey('user', userId);
    await this.redis.setex(key, this.CACHE_TTL, JSON.stringify(user));
  }

  /**
   * 获取缓存的用户信息
   */
  async getUser(userId: string): Promise<User | undefined> {
    const key = this.getKey('user', userId);
    const value = await this.redis.get(key);

    if (value === null) {
      return undefined; // 缓存未命中
    }

    return JSON.parse(value);
  }

  /**
   * 缓存用户角色权限
   */
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const key = this.getKey('role', userId);
    await this.redis.setex(key, this.CACHE_TTL, role);
  }

  /**
   * 获取缓存的用户角色
   */
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const key = this.getKey('role', userId);
    const value = await this.redis.get(key);

    if (value === null) {
      return undefined; // 缓存未命中
    }

    return value as UserRole;
  }

  /**
   * 清除用户的所有权限缓存
   */
  async clearUserCache(userId: string): Promise<void> {
    const keys = [
      this.getKey('accessible_ids', userId),
      this.getKey('superior_ids', userId),
      this.getKey('user', userId),
      this.getKey('role', userId),
    ];

    await this.redis.del(...keys);
  }

  /**
   * 清除多个用户的权限缓存
   */
  async clearUsersCache(userIds: string[]): Promise<void> {
    const keys: string[] = [];

    for (const userId of userIds) {
      keys.push(
        this.getKey('accessible_ids', userId),
        this.getKey('superior_ids', userId),
        this.getKey('user', userId),
        this.getKey('role', userId),
      );
    }

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * 清除所有权限缓存
   */
  async clearAllCache(): Promise<void> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    accessibleIdsKeys: number;
    superiorIdsKeys: number;
    userKeys: number;
    roleKeys: number;
  }> {
    const pattern = `${this.KEY_PREFIX}*`;
    const keys = await this.redis.keys(pattern);

    return {
      totalKeys: keys.length,
      accessibleIdsKeys: keys.filter((k) => k.includes(':accessible_ids:')).length,
      superiorIdsKeys: keys.filter((k) => k.includes(':superior_ids:')).length,
      userKeys: keys.filter((k) => k.includes(':user:')).length,
      roleKeys: keys.filter((k) => k.includes(':role:')).length,
    };
  }
}
