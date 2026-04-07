import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { HandoverService } from '../handover/handover.service';
import { HandoverType } from '../handover/entities/handover.entity';

@Controller('customers')
export class CustomerController {
  constructor(
    private svc: CustomerService,
    private handoverService: HandoverService,
  ) {}

  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any, @Request() req: any) { return this.svc.findAll(q, req.user.userId); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.svc.findOne(id, req.user.userId); }
  @Get(':id/360') get360(@Param('id') id: string) { return this.svc.getCustomer360View(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.userId); }
  @Delete(':id') async remove(@Param('id') id: string, @Request() req: any) { await this.svc.remove(id, req.user.userId); return { message: '删除成功' }; }
  @Post(':id/contacts') addContact(@Param('id') id: string, @Body() data: any) { return this.svc.addContact(id, data); }
  @Get(':id/contacts') getContacts(@Param('id') id: string) { return this.svc.getContacts(id); }
  @Delete(':id/contacts/:cid') async removeContact(@Param('id') id: string, @Param('cid') cid: string) { await this.svc.removeContact(cid); return { message: '删除成功' }; }
  @Put('contacts/:cid') updateContact(@Param('cid') cid: string, @Body() data: any) { return this.svc.updateContact(cid, data); }
  @Delete('contacts/:cid') async removeContactByCid(@Param('cid') cid: string) { await this.svc.removeContact(cid); return { message: '删除成功' }; }

  /**
   * 添加客户跟进记录
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
   * 获取客户跟进记录
   */
  @Get(':id/follow-ups')
  getFollowUps(@Param('id') id: string, @Request() req: any) {
    return this.svc.getFollowUps(id, req.user.userId);
  }

  /**
   * 分配客户给下级
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
   * 批量分配客户
   */
  @Post('batch-assign')
  batchAssign(
    @Body() body: { customerIds: string[]; userId: string; remark?: string },
    @Request() req: any,
  ) {
    return this.svc.batchAssign(body.customerIds, body.userId, req.user.userId);
  }

  /**
   * 添加客户拜访记录
   */
  @Post(':id/visits')
  addVisit(
    @Param('id') id: string,
    @Body() data: any,
    @Request() req: any,
  ) {
    return this.svc.addVisit(id, data, req.user.userId);
  }

  /**
   * 获取客户拜访记录
   */
  @Get(':id/visits')
  getVisits(@Param('id') id: string, @Request() req: any) {
    return this.svc.getVisits(id, req.user.userId);
  }

  /**
   * 离职移交客户
   */
  @Post(':id/handover')
  handover(
    @Param('id') id: string,
    @Body() body: { toUserId: string; reason: string; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      HandoverType.CUSTOMER,
      id,
      req.user.userId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  /**
   * 获取客户的移交历史
   */
  @Get(':id/handover-history')
  getHandoverHistory(@Param('id') id: string) {
    return this.handoverService.getHandoverHistory(id, HandoverType.CUSTOMER);
  }
}