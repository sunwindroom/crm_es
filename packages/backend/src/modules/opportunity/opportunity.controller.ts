import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { OpportunityService } from './opportunity.service';
import { OpportunityExtensionService } from './opportunity-extension.service';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';

@Controller('opportunities')
export class OpportunityController {
  constructor(
    private svc: OpportunityService,
    private extensionSvc: OpportunityExtensionService,
    private handoverService: HandoverService,
  ) {}

  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any, @Request() req: any) { return this.svc.findAll(q, req.user.userId); }
  @Get('funnel') funnel() { return this.svc.getSalesFunnel(); }
  @Get('forecast') forecast() { return this.svc.getSalesForecast(); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.userId); }
  @Delete(':id') async remove(@Param('id') id: string, @Request() req: any) { await this.svc.remove(id, req.user.userId); return { message: '删除成功' }; }
  @Put(':id/stage') updateStage(@Param('id') id: string, @Body('stage') stage: any, @Request() req: any) { return this.svc.updateStage(id, stage, req.user.userId); }
  @Post(':id/win') win(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.extensionSvc.win(id, data, req.user.userId);
  }
  @Post(':id/lose') lose(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.extensionSvc.lose(id, data, req.user.userId);
  }

  /**
   * 分配商机给下级
   */
  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() body: { userId: string; remark?: string },
    @Request() req: any,
  ) {
    return this.svc.assign(id, body.userId, req.user.userId);
  }

  /**
   * 批量分配商机
   */
  @Post('batch-assign')
  batchAssign(
    @Body() body: { opportunityIds: string[]; userId: string; remark?: string },
    @Request() req: any,
  ) {
    return this.svc.batchAssign(body.opportunityIds, body.userId, req.user.userId);
  }

  /**
   * 添加商机跟进记录
   */
  @Post(':id/follow-ups')
  addFollowUp(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.svc.addFollowUp(id, data, req.user.userId);
  }

  /**
   * 获取商机跟进记录
   */
  @Get(':id/follow-ups')
  getFollowUps(@Param('id') id: string, @Request() req: any) {
    return this.svc.getFollowUps(id, req.user.userId);
  }

  /**
   * 转化商机为项目（阶段为赢单的商机）
   */
  @Post(':id/convert-to-project')
  convertToProject(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.svc.convertToProject(id, data, req.user.userId);
  }

  /**
   * 离职移交商机
   */
  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.OPPORTUNITY,
      id,
      req.user.userId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  /**
   * 获取商机的移交历史
   */
  @Get(':id/handover-history')
  getHandoverHistory(@Param('id') id: string) {
    return this.handoverService.getHandoverHistory(id, HandoverType.OPPORTUNITY);
  }
}