import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerAnalysisService } from '../services/customer-analysis.service';
import { CustomerValueQueryDto, DistributionQueryDto, ActivityQueryDto } from '../dto/customer-analysis-query.dto';

@ApiTags('报表-客户分析')
@Controller('reports/customer-analysis')
@UseGuards(JwtAuthGuard)
export class CustomerAnalysisController {
  constructor(private readonly customerAnalysisService: CustomerAnalysisService) {}

  @Get('value')
  @ApiOperation({ summary: '获取客户价值分析' })
  @ApiResponse({ status: 200, description: '返回客户价值数据' })
  async getCustomerValue(
    @Request() req,
    @Query() query: CustomerValueQueryDto,
  ) {
    return this.customerAnalysisService.getCustomerValue(req.user, query);
  }

  @Get('distribution')
  @ApiOperation({ summary: '获取客户分布统计' })
  @ApiResponse({ status: 200, description: '返回客户分布数据' })
  async getCustomerDistribution(
    @Request() req,
    @Query() query: DistributionQueryDto,
  ) {
    return this.customerAnalysisService.getCustomerDistribution(req.user, query);
  }

  @Get('activity')
  @ApiOperation({ summary: '获取客户活跃度分析' })
  @ApiResponse({ status: 200, description: '返回客户活跃度数据' })
  async getCustomerActivity(
    @Request() req,
    @Query() query: ActivityQueryDto,
  ) {
    return this.customerAnalysisService.getCustomerActivity(req.user, query);
  }
}
