import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ActivityService } from '../services/activity.service';
import { FrequencyQueryDto, EffectivenessQueryDto } from '../dto/activity-query.dto';

@ApiTags('报表-跟进活动')
@Controller('reports/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('frequency')
  @ApiOperation({ summary: '获取跟进频率统计' })
  @ApiResponse({ status: 200, description: '返回跟进频率数据' })
  async getFollowUpFrequency(
    @Request() req,
    @Query() query: FrequencyQueryDto,
  ) {
    return this.activityService.getFollowUpFrequency(req.user, query);
  }

  @Get('effectiveness')
  @ApiOperation({ summary: '获取跟进效果分析' })
  @ApiResponse({ status: 200, description: '返回跟进效果数据' })
  async getFollowUpEffectiveness(
    @Request() req,
    @Query() query: EffectivenessQueryDto,
  ) {
    return this.activityService.getFollowUpEffectiveness(req.user, query);
  }
}
