import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let stack: string | undefined;

    // 处理不同类型的异常
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
      if (Array.isArray(message)) message = message.join('; ');
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
      
      // 特殊处理数据库错误
      if (exception.message.includes('database') || exception.message.includes('connection')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = '数据库连接错误，请稍后重试';
      }
      
      // 特殊处理TypeORM错误
      if (exception.message.includes('query') || exception.message.includes('entity')) {
        status = HttpStatus.BAD_REQUEST;
        message = '数据操作错误';
      }
    }

    // 记录错误日志
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      status,
      message,
      stack: process.env.APP_ENV === 'development' ? stack : undefined,
      body: request.body,
      query: request.query,
      params: request.params,
      user: (request as any).user?.userId,
    };

    // 根据错误级别记录不同日志
    if (status >= 500) {
      this.logger.error('服务器错误', JSON.stringify(errorLog, null, 2));
    } else if (status >= 400) {
      this.logger.warn('客户端错误', JSON.stringify(errorLog, null, 2));
    } else {
      this.logger.log('请求处理', JSON.stringify(errorLog, null, 2));
    }

    // 返回错误响应
    const errorResponse: any = {
      code: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 开发环境返回详细错误信息
    if (process.env.APP_ENV === 'development') {
      errorResponse.stack = stack;
      errorResponse.details = exception;
    }

    response.status(status).json(errorResponse);
  }
}
