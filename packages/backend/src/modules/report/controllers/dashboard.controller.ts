import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardService } from '../services/dashboard.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';

@ApiTags('报表-仪表盘')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '获取仪表盘统计数据' })
  @ApiResponse({ status: 200, description: '返回仪表盘统计数据' })
  async getDashboardStats(
    @Request() req,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getDashboardStats(req.user, query);
  }
}
