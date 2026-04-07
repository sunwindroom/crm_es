import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger(SecurityGuard.name);

  // 黑名单IP
  private readonly blacklistedIPs = new Set<string>();

  // 可疑IP及其违规次数
  private readonly suspiciousIPs = new Map<string, number>();

  // 最大违规次数
  private readonly MAX_VIOLATIONS = 5;

  // 违规重置时间(毫秒)
  private readonly VIOLATION_RESET_TIME = 60 * 60 * 1000; // 1小时

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIP(request);

    // 检查IP黑名单
    if (this.isBlacklisted(ip)) {
      this.logger.warn(`Blocked request from blacklisted IP: ${ip}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: '您的IP已被封禁',
          error: 'Forbidden',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // 检查请求头
    this.checkHeaders(request);

    // 检查请求体大小
    this.checkRequestBodySize(request);

    // 检查SQL注入
    this.checkSQLInjection(request);

    // 检查XSS攻击
    this.checkXSS(request);

    return true;
  }

  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private isBlacklisted(ip: string): boolean {
    return this.blacklistedIPs.has(ip);
  }

  private addToBlacklist(ip: string): void {
    this.blacklistedIPs.add(ip);
    this.suspiciousIPs.delete(ip);
    this.logger.warn(`IP added to blacklist: ${ip}`);

    // 24小时后自动解封
    setTimeout(() => {
      this.blacklistedIPs.delete(ip);
      this.logger.log(`IP removed from blacklist: ${ip}`);
    }, 24 * 60 * 60 * 1000);
  }

  private trackSuspiciousIP(ip: string): void {
    const violations = this.suspiciousIPs.get(ip) || 0;
    this.suspiciousIPs.set(ip, violations + 1);

    if (violations + 1 >= this.MAX_VIOLATIONS) {
      this.addToBlacklist(ip);
    }

    // 重置违规计数
    setTimeout(() => {
      this.suspiciousIPs.delete(ip);
    }, this.VIOLATION_RESET_TIME);
  }

  private checkHeaders(request: Request): void {
    const ip = this.getClientIP(request);

    // 检查User-Agent
    const userAgent = request.headers['user-agent'];
    if (!userAgent) {
      this.logger.warn(`Missing User-Agent header from IP: ${ip}`);
      this.trackSuspiciousIP(ip);
    }

    // 检查Referer
    const referer = request.headers['referer'];
    const host = request.headers['host'];

    // 如果有Referer,检查是否来自允许的域名
    if (referer && host) {
      try {
        const refererUrl = new URL(referer);
        const refererHost = refererUrl.hostname;

        // 简单的域名检查(生产环境应该配置允许的域名列表)
        if (!refererHost.includes(host.toString())) {
          this.logger.warn(`Suspicious Referer header from IP: ${ip}, Referer: ${referer}`);
          this.trackSuspiciousIP(ip);
        }
      } catch (error) {
        this.logger.warn(`Invalid Referer header from IP: ${ip}`);
      }
    }
  }

  private checkRequestBodySize(request: Request): void {
    const contentLength = parseInt(request.headers['content-length'] as string, 10);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (contentLength > MAX_SIZE) {
      const ip = this.getClientIP(request);
      this.logger.warn(`Request body too large from IP: ${ip}, Size: ${contentLength}`);
      this.trackSuspiciousIP(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: '请求体过大',
          error: 'Payload Too Large',
        },
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
  }

  private checkSQLInjection(request: Request): void {
    const ip = this.getClientIP(request);
    const sqlPatterns = [
      /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/i,
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/i,
      /(--|;|\/\*|\*\/)/,
      /(\b(WHERE|HAVING)\b.*\b(OR|AND)\b)/i,
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        for (const pattern of sqlPatterns) {
          if (pattern.test(value)) {
            return true;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
          if (checkValue(value[key])) {
            return true;
          }
        }
      }
      return false;
    };

    // 检查查询参数
    if (checkValue(request.query)) {
      this.logger.warn(`SQL injection attempt detected from IP: ${ip}`);
      this.trackSuspiciousIP(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '请求包含非法字符',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 检查请求体
    if (checkValue(request.body)) {
      this.logger.warn(`SQL injection attempt detected from IP: ${ip}`);
      this.trackSuspiciousIP(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '请求包含非法字符',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private checkXSS(request: Request): void {
    const ip = this.getClientIP(request);
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi,
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        for (const pattern of xssPatterns) {
          if (pattern.test(value)) {
            return true;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        for (const key in value) {
          if (checkValue(value[key])) {
            return true;
          }
        }
      }
      return false;
    };

    // 检查查询参数
    if (checkValue(request.query)) {
      this.logger.warn(`XSS attack attempt detected from IP: ${ip}`);
      this.trackSuspiciousIP(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '请求包含非法字符',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // 检查请求体
    if (checkValue(request.body)) {
      this.logger.warn(`XSS attack attempt detected from IP: ${ip}`);
      this.trackSuspiciousIP(ip);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: '请求包含非法字符',
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 获取黑名单IP列表
  getBlacklistedIPs(): string[] {
    return Array.from(this.blacklistedIPs);
  }

  // 获取可疑IP列表
  getSuspiciousIPs(): Array<{ ip: string; violations: number }> {
    return Array.from(this.suspiciousIPs.entries()).map(([ip, violations]) => ({
      ip,
      violations,
    }));
  }

  // 从黑名单移除IP
  removeFromBlacklist(ip: string): void {
    this.blacklistedIPs.delete(ip);
    this.logger.log(`IP removed from blacklist: ${ip}`);
  }

  // 清空黑名单
  clearBlacklist(): void {
    const count = this.blacklistedIPs.size;
    this.blacklistedIPs.clear();
    this.suspiciousIPs.clear();
    this.logger.log(`Blacklist cleared, ${count} IPs removed`);
  }
}
