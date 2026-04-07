import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HelmetMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HelmetMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // 设置安全相关的HTTP头

    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 防止点击劫持
    res.setHeader('X-Frame-Options', 'DENY');

    // 启用浏览器的XSS保护
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 限制引用来源
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 内容安全策略
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    );

    // 权限策略
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
    );

    // 移除服务器信息
    res.removeHeader('X-Powered-By');

    // 设置Strict-Transport-Security (仅HTTPS)
    if (req.secure) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    next();
  }
}
