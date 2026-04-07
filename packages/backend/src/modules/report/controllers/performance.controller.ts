import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerformanceService } from '../services/performance.service';
import { PerformanceQueryDto, TeamPerformanceQueryDto, TrendQueryDto } from '../dto/performance-query.dto';

@ApiTags('报表-业绩统计')
@Controller('reports/performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('personal')
  @ApiOperation({ summary: '获取个人业绩统计' })
  @ApiResponse({ status: 200, description: '返回个人业绩数据' })
  async getPersonalPerformance(
    @Request() req,
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performanceService.getPersonalPerformance(req.user, query);
  }

  @Get('team')
  @ApiOperation({ summary: '获取团队业绩统计' })
  @ApiResponse({ status: 200, description: '返回团队业绩数据' })
  async getTeamPerformance(
    @Request() req,
    @Query() query: TeamPerformanceQueryDto,
  ) {
    return this.performanceService.getTeamPerformance(req.user, query);
  }

  @Get('trend')
  @ApiOperation({ summary: '获取业绩趋势分析' })
  @ApiResponse({ status: 200, description: '返回业绩趋势数据' })
  async getPerformanceTrend(
    @Request() req,
    @Query() query: TrendQueryDto,
  ) {
    return this.performanceService.getPerformanceTrend(req.user, query);
  }
}
