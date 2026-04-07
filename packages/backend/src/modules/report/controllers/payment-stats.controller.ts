import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentStatsService } from '../services/payment-stats.service';
import { PaymentProgressQueryDto, ForecastQueryDto, OverdueQueryDto } from '../dto/payment-stats-query.dto';

@ApiTags('报表-回款统计')
@Controller('reports/payment')
@UseGuards(JwtAuthGuard)
export class PaymentStatsController {
  constructor(private readonly paymentStatsService: PaymentStatsService) {}

  @Get('progress')
  @ApiOperation({ summary: '获取回款进度统计' })
  @ApiResponse({ status: 200, description: '返回回款进度数据' })
  async getPaymentProgress(
    @Request() req,
    @Query() query: PaymentProgressQueryDto,
  ) {
    return this.paymentStatsService.getPaymentProgress(req.user, query);
  }

  @Get('forecast')
  @ApiOperation({ summary: '获取回款预测' })
  @ApiResponse({ status: 200, description: '返回回款预测数据' })
  async getPaymentForecast(
    @Request() req,
    @Query() query: ForecastQueryDto,
  ) {
    return this.paymentStatsService.getPaymentForecast(req.user, query);
  }

  @Get('overdue')
  @ApiOperation({ summary: '获取逾期回款统计' })
  @ApiResponse({ status: 200, description: '返回逾期回款数据' })
  async getOverduePayments(
    @Request() req,
    @Query() query: OverdueQueryDto,
  ) {
    return this.paymentStatsService.getOverduePayments(req.user, query);
  }
}
