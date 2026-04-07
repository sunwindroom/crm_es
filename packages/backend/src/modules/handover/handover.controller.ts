import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { HandoverService } from './handover.service';
import { HandoverType } from './entities/handover.entity';

@Controller('handovers')
export class HandoverController {
  constructor(private readonly handoverService: HandoverService) {}

  /**
   * 创建离职移交申请
   */
  @Post()
  createHandover(
    @Body() body: {
      type: HandoverType;
      resourceId: string;
      fromUserId: string;
      toUserId: string;
      reason: string;
      remark?: string;
    },
    @Request() req: any,
  ) {
    return this.handoverService.createHandover(
      body.type,
      body.resourceId,
      body.fromUserId,
      body.toUserId,
      body.reason,
      body.remark,
      req.user.userId,
    );
  }

  /**
   * 审批离职移交申请
   */
  @Put(':id/approve')
  approveHandover(
    @Param('id') id: string,
    @Body() body: { approved: boolean; remark?: string },
    @Request() req: any,
  ) {
    return this.handoverService.approveHandover(id, body.approved, body.remark, req.user.userId);
  }

  /**
   * 获取移交历史记录
   */
  @Get('history/:resourceId')
  getHandoverHistory(
    @Param('resourceId') resourceId: string,
    @Query('type') type?: HandoverType,
  ) {
    return this.handoverService.getHandoverHistory(resourceId, type);
  }

  /**
   * 获取待处理的移交申请
   */
  @Get('pending')
  getPendingHandovers() {
    return this.handoverService.getPendingHandovers();
  }
}
