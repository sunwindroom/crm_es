import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

// 简单的内存缓存实现
class SimpleCacheStore {
  private store = new Map<string, { value: any; expireAt: number }>();

  async get(key: string): Promise<any> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expireAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.store.set(key, { value, expireAt: Date.now() + ttl * 1000 });
  }
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly cacheStore = new SimpleCacheStore();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    // 只缓存 GET 请求
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 检查缓存
    return this.getCachedValue(cacheKey).pipe(
      tap((cached) => {
        if (cached) {
          this.logger.debug(`Cache hit: ${cacheKey}`);
        }
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, query } = request;
    const queryString = JSON.stringify(query);
    return `${method}:${url}:${queryString}`;
  }

  private getCachedValue(key: string): Observable<any> {
    return new Observable((observer) => {
      this.cacheStore.get(key).then((cached) => {
        if (cached) {
          observer.next(cached);
          observer.complete();
        } else {
          observer.next(null);
          observer.complete();
        }
      }).catch((error) => {
        this.logger.error(`Cache get error: ${error.message}`);
        observer.next(null);
        observer.complete();
      });
    });
  }

  private setCachedValue(key: string, value: any, ttl: number = 300): void {
    this.cacheStore.set(key, value, ttl).catch((error) => {
      this.logger.error(`Cache set error: ${error.message}`);
    });
  }
}
