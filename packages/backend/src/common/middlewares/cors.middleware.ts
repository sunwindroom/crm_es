import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorsMiddleware.name);

  // 允许的域名列表
  private readonly allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.10.19:5173',
    'http://192.168.10.19:5174',
    // 生产环境域名
    'https://crm.example.com',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // 检查请求来源是否在允许列表中
    if (origin && this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      this.logger.debug(`CORS: Allowed origin ${origin}`);
    } else if (origin) {
      this.logger.warn(`CORS: Blocked origin ${origin}`);
    }

    // 允许的HTTP方法
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );

    // 允许的请求头
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    );

    // 允许携带凭证
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // 预检请求的缓存时间(秒)
    res.setHeader('Access-Control-Max-Age', '86400');

    // 暴露的响应头
    res.setHeader(
      'Access-Control-Expose-Headers',
      'Content-Length, Content-Type, X-Total-Count',
    );

    // 处理预检请求
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  }

  private isOriginAllowed(origin: string): boolean {
    // 开发环境允许所有本地请求
    if (
      process.env.NODE_ENV === 'development' &&
      (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ) {
      return true;
    }

    // 检查是否在允许列表中
    return this.allowedOrigins.some((allowed) => origin === allowed);
  }
}
