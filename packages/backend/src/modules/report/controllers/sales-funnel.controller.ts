import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SalesFunnelService } from '../services/sales-funnel.service';
import { SalesFunnelQueryDto, ConversionRateQueryDto } from '../dto/sales-funnel-query.dto';

@ApiTags('报表-销售漏斗')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class SalesFunnelController {
  constructor(private readonly salesFunnelService: SalesFunnelService) {}

  @Get('sales-funnel')
  @ApiOperation({ summary: '获取销售漏斗数据' })
  @ApiResponse({ status: 200, description: '返回销售漏斗数据' })
  async getSalesFunnel(
    @Request() req,
    @Query() query: SalesFunnelQueryDto,
  ) {
    return this.salesFunnelService.getSalesFunnel(req.user, query);
  }

  @Get('conversion-rate')
  @ApiOperation({ summary: '获取阶段转化率数据' })
  @ApiResponse({ status: 200, description: '返回阶段转化率数据' })
  async getConversionRate(
    @Request() req,
    @Query() query: ConversionRateQueryDto,
  ) {
    return this.salesFunnelService.getConversionRate(req.user, query);
  }
}
