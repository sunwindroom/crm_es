import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectStatsService } from '../services/project-stats.service';
import { ProjectProgressQueryDto, TimesheetQueryDto } from '../dto/project-stats-query.dto';

@ApiTags('报表-项目统计')
@Controller('reports/project')
@UseGuards(JwtAuthGuard)
export class ProjectStatsController {
  constructor(private readonly projectStatsService: ProjectStatsService) {}

  @Get('progress')
  @ApiOperation({ summary: '获取项目进度统计' })
  @ApiResponse({ status: 200, description: '返回项目进度数据' })
  async getProjectProgress(
    @Request() req,
    @Query() query: ProjectProgressQueryDto,
  ) {
    return this.projectStatsService.getProjectProgress(req.user, query);
  }

  @Get('timesheet')
  @ApiOperation({ summary: '获取工时统计' })
  @ApiResponse({ status: 200, description: '返回工时统计数据' })
  async getTimesheetStats(
    @Request() req,
    @Query() query: TimesheetQueryDto,
  ) {
    return this.projectStatsService.getTimesheetStats(req.user, query);
  }
}
