import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async create(@Body() dto: CreatePaymentPlanDto) {
    return this.paymentService.create(dto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.paymentService.findAll(query);
  }

  @Get('overdue')
  async getOverdue() {
    return this.paymentService.getOverduePayments();
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: number) {
    return this.paymentService.getUpcomingPayments(Number(days) || 7);
  }

  @Get('statistics')
  async getStats() {
    return this.paymentService.getPaymentStatistics();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePaymentPlanDto>) {
    return this.paymentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.paymentService.remove(id);
    return { message: '删除成功' };
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Body('actualDate') actualDate?: Date) {
    return this.paymentService.confirm(id, actualDate);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentService.reject(id, reason);
  }
}

// ─── 回款计划路由 (复用服务) ────────────────────────────────
@Controller('payment-plans')
export class PaymentPlanController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('statistics')
  async getStats() {
    return this.paymentService.getPaymentStatistics();
  }

  @Get('overdue')
  async getOverdue() {
    return this.paymentService.getOverduePayments();
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: number) {
    return this.paymentService.getUpcomingPayments(Number(days) || 7);
  }
}
