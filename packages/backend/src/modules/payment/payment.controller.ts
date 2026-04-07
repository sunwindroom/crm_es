import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentPlanDto } from './dto/create-payment-plan.dto';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly handoverService: HandoverService,
  ) {}

  @Post()
  async create(@Body() dto: CreatePaymentPlanDto, @Request() req: any) {
    return this.paymentService.create(dto, req.user.userId);
  }

  @Get()
  async findAll(@Query() query: any, @Request() req: any) {
    return this.paymentService.findAll(query, req.user.userId);
  }

  @Get('overdue')
  async getOverdue(@Request() req: any) {
    return this.paymentService.getOverduePayments(req.user.userId);
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: number, @Request() req?: any) {
    return this.paymentService.getUpcomingPayments(Number(days) || 7, req?.user?.userId);
  }

  @Get('statistics')
  async getStats(@Request() req: any) {
    return this.paymentService.getPaymentStatistics(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreatePaymentPlanDto>, @Request() req: any) {
    return this.paymentService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.paymentService.remove(id, req.user.userId);
    return { message: '删除成功' };
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string, @Body('actualDate') actualDate: Date, @Request() req: any) {
    return this.paymentService.confirm(id, actualDate, req.user.userId);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.paymentService.reject(id, reason, req.user.userId);
  }

  // ─── 财务人员实际回款登记 ───────────────────────────────────────────────

  @Post(':id/register')
  async registerPayment(
    @Param('id') id: string,
    @Body() body: { actualDate: string; amount?: number; remark?: string },
    @Request() req: any
  ) {
    return this.paymentService.registerPayment(id, body, req.user.userId);
  }

  // ─── 离职移交 ───────────────────────────────────────────────

  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.PAYMENT,
      id,
      req.user.userId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  @Get(':id/handover-history')
  getHandoverHistory(@Param('id') id: string) {
    return this.handoverService.getHandoverHistory(id, HandoverType.PAYMENT);
  }
}

// ─── 回款计划路由 (复用服务) ────────────────────────────────
@Controller('payment-plans')
export class PaymentPlanController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('statistics')
  async getStats(@Request() req: any) {
    return this.paymentService.getPaymentStatistics(req.user.userId);
  }

  @Get('overdue')
  async getOverdue(@Request() req: any) {
    return this.paymentService.getOverduePayments(req.user.userId);
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: number, @Request() req?: any) {
    return this.paymentService.getUpcomingPayments(Number(days) || 7, req?.user?.userId);
  }
}
