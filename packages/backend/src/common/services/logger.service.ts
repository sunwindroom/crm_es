import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    // 确保日志目录存在
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
          const contextStr = context ? `[${context}] ` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          const stackStr = stack ? `\n${stack}` : '';
          return `${timestamp} [${level.toUpperCase()}] ${contextStr}${message}${metaStr}${stackStr}`;
        }),
      ),
      transports: [
        // 控制台输出
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const contextStr = context ? `[${context}] ` : '';
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}] ${contextStr}${message}${metaStr}`;
            }),
          ),
        }),
        // 错误日志文件
        new winston.transports.File({ 
          filename: path.join(logsDir, 'error.log'), 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 警告日志文件
        new winston.transports.File({ 
          filename: path.join(logsDir, 'warn.log'), 
          level: 'warn',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // 所有日志文件
        new winston.transports.File({ 
          filename: path.join(logsDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
    });
  }

  log(message: string, context?: string) { 
    this.logger.info(message, { context }); 
  }

  error(message: string, trace?: string, context?: string) { 
    this.logger.error(message, { trace, context }); 
  }

  warn(message: string, context?: string) { 
    this.logger.warn(message, { context }); 
  }

  debug(message: string, context?: string) { 
    this.logger.debug(message, { context }); 
  }

  verbose(message: string, context?: string) { 
    this.logger.verbose(message, { context }); 
  }

  // 添加结构化日志方法
  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
    });
  }

  logDatabase(operation: string, table: string, duration: number, success: boolean) {
    this.logger.info('Database Operation', {
      context: 'Database',
      operation,
      table,
      duration: `${duration}ms`,
      success,
    });
  }

  logBusiness(action: string, entity: string, entityId: string, userId: string, details?: any) {
    this.logger.info('Business Operation', {
      context: 'Business',
      action,
      entity,
      entityId,
      userId,
      details,
    });
  }

  logSecurity(event: string, userId: string, ip: string, details?: any) {
    this.logger.warn('Security Event', {
      context: 'Security',
      event,
      userId,
      ip,
      details,
    });
  }
}
