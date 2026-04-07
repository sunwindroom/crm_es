import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MonitoringService } from '../../modules/monitoring/monitoring.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private requestTimes = new Map<string, number[]>();
  private readonly MAX_REQUEST_TIMES = 100;

  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();
    const route = request.route?.path || request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const { method, url, ip } = request;
          const statusCode = response.statusCode;

          // 记录性能指标
          this.recordPerformance(route, duration);
          this.monitoringService.recordRequest(statusCode >= 400, duration);

          // 记录慢查询
          if (duration > 1000) {
            this.logger.warn(
              `Slow request detected: ${method} ${url} - ${duration}ms`,
            );
          }

          // 记录请求日志
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms - ${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const { method, url } = request;

          this.recordPerformance(route, duration);
          this.monitoringService.recordRequest(true, duration);

          this.logger.error(
            `${method} ${url} - ${duration}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }

  private recordPerformance(route: string, duration: number) {
    if (!this.requestTimes.has(route)) {
      this.requestTimes.set(route, []);
    }

    const times = this.requestTimes.get(route);
    times.push(duration);

    // 保持数组大小
    if (times.length > this.MAX_REQUEST_TIMES) {
      times.shift();
    }
  }

  getPerformanceStats(route?: string) {
    if (route) {
      return this.getRouteStats(route);
    }

    const stats = {};
    for (const [key, times] of this.requestTimes.entries()) {
      stats[key] = this.calculateStats(times);
    }
    return stats;
  }

  private getRouteStats(route: string) {
    const times = this.requestTimes.get(route);
    if (!times || times.length === 0) {
      return null;
    }
    return this.calculateStats(times);
  }

  private calculateStats(times: number[]) {
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      count: times.length,
      avg: Math.round(sum / times.length),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}
