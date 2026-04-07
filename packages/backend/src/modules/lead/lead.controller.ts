import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadExtensionService } from './lead-extension.service';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';
import { LeadHandoverService } from './lead-handover.service';
import { TriggerHandoverDto } from './dto/trigger-handover.dto';

@Controller('leads')
export class LeadController {
  constructor(
    private readonly svc: LeadService,
    private readonly extensionSvc: LeadExtensionService,
    private readonly handoverService: HandoverService,
    private readonly leadHandoverService: LeadHandoverService,
  ) {}

  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any, @Request() req: any) { return this.svc.findAll(q, req.user.userId); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.userId); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.userId); }
  @Delete(':id') async remove(@Param('id') id: string, @Request() req: any) { await this.svc.remove(id, req.user.userId); return { message: '删除成功' }; }
  @Post(':id/assign') assign(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.extensionSvc.assign(id, data, req.user.userId);
  }
  @Post('batch-assign') batchAssign(@Body() body: { leadIds: string[]; userId: string; remark?: string }, @Request() req: any) {
    return this.extensionSvc.assignBatch(body.leadIds, { userId: body.userId, remark: body.remark }, req.user.userId);
  }
  @Post(':id/convert') convert(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.extensionSvc.convert(id, data, req.user.userId);
  }
  @Post(':id/lost') markLost(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) { return this.svc.markAsLost(id, reason, req.user.userId); }

  /**
   * 线索跟踪记录
   */
  @Post(':id/follow-ups')
  addFollowUp(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    return this.svc.addFollowUp(id, data, req.user.userId);
  }

  @Get(':id/follow-ups')
  getFollowUps(@Param('id') id: string, @Request() req: any) {
    return this.svc.getFollowUps(id, req.user.userId);
  }

  /**
   * 离职移交线索
   */
  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.LEAD,
      id,
      req.user.userId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  /**
   * 获取线索的移交历史
   */
  @Get(':id/handover-history')
  getHandoverHistory(@Param('id') id: string) {
    return this.handoverService.getHandoverHistory(id, HandoverType.LEAD);
  }

  /**
   * 触发线索赢单交接流程
   * 线索赢单后，自动将线索负责人转给客服经理
   */
  @Post(':id/trigger-handover')
  async triggerHandover(
    @Param('id') id: string,
    @Body() dto: TriggerHandoverDto,
    @Request() req: any,
  ) {
    return this.leadHandoverService.triggerHandover(id, req.user.userId, dto.csManagerId);
  }
}
