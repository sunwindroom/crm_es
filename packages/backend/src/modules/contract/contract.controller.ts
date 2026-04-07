import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';

@Controller('contracts')
export class ContractController {
  constructor(
    private svc: ContractService,
    private handoverService: HandoverService,
  ) {}

  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any, @Request() req: any) { return this.svc.findAll(q, req.user.userId); }
  @Get('expiring') expiring(@Query('days') d?: number) { return this.svc.getExpiringContracts(Number(d)||30); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.userId); }
  @Delete(':id') async remove(@Param('id') id: string, @Request() req: any) { await this.svc.remove(id, req.user.userId); return { message: '删除成功' }; }
  @Post(':id/submit') submit(@Param('id') id: string, @Request() req: any) { return this.svc.submitForApproval(id, req.user.userId); }
  @Post(':id/approve') approve(@Param('id') id: string, @Request() req: any) { return this.svc.approve(id, req.user.userId); }
  @Post(':id/reject') reject(@Param('id') id: string, @Request() req: any) { return this.svc.reject(id, req.user.userId); }
  @Post(':id/sign') sign(@Param('id') id: string, @Body('signDate') d?: Date, @Request() req?: any) { return this.svc.sign(id, d, req?.user?.userId); }

  // ─── 回款节点管理 ───────────────────────────────────────────────

  @Post(':id/payment-nodes')
  addPaymentNode(
    @Param('id') id: string,
    @Body() body: { name: string; amount: number; plannedDate: string; remark?: string },
    @Request() req: any
  ) {
    return this.svc.addPaymentNode(id, body, req.user.userId);
  }

  @Get(':id/payment-nodes')
  getPaymentNodes(@Param('id') id: string) {
    return this.svc.getPaymentNodes(id);
  }

  @Put('payment-nodes/:nodeId')
  updatePaymentNode(
    @Param('nodeId') nodeId: string,
    @Body() body: any,
    @Request() req: any
  ) {
    return this.svc.updatePaymentNode(nodeId, body, req.user.userId);
  }

  @Delete('payment-nodes/:nodeId')
  async removePaymentNode(@Param('nodeId') nodeId: string, @Request() req: any) {
    await this.svc.removePaymentNode(nodeId, req.user.userId);
    return { message: '删除成功' };
  }

  // ─── 项目经理指派 ───────────────────────────────────────────────

  @Post(':id/assign-manager')
  assignManager(
    @Param('id') id: string,
    @Body() body: { managerId: string },
    @Request() req: any
  ) {
    return this.svc.assignManager(id, body.managerId, req.user.userId);
  }

  // ─── 离职移交 ───────────────────────────────────────────────

  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.CONTRACT,
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
    return this.handoverService.getHandoverHistory(id, HandoverType.CONTRACT);
  }
}