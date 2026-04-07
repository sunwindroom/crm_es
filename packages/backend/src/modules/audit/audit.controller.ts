import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../../common/decorators/require-role.decorator';
import { UserRole } from '../user/entities/user.entity';
import { AuditLogService, QueryAuditLogDto } from '../../common/services/audit-log.service';
import { AuditAction, AuditResource } from './entities/audit-log.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@RequireRole(UserRole.ADMIN)
export class AuditController {
  constructor(private auditLogService: AuditLogService) {}

  /**
   * 查询审计日志列表
   */
  @Get()
  async query(@Query() query: QueryAuditLogDto) {
    return await this.auditLogService.query(query);
  }

  /**
   * 查询审计日志详情
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.auditLogService.findById(id);
  }

  /**
   * 获取当前用户的操作历史
   */
  @Get('my-history')
  @UseGuards(JwtAuthGuard)
  async getMyHistory(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    const userId = (req.user as any).id;
    return await this.auditLogService.getUserHistory(userId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * 获取资源的操作历史
   */
  @Get('resource/:resource/:resourceId')
  async getResourceHistory(
    @Param('resource') resource: AuditResource,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.auditLogService.getResourceHistory(
      resource,
      resourceId,
      limit ? Number(limit) : undefined,
    );
  }

  /**
   * 统计权限校验失败次数
   */
  @Get('permission-denied-stats')
  async getPermissionDeniedStats(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const count = await this.auditLogService.countPermissionDenied(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return { count };
  }
}
