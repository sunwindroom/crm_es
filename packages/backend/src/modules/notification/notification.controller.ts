import { Controller, Get, Put, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: NotificationQueryDto) {
    return this.notificationService.findAll(req.user.userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.findOne(id, req.user.userId);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.userId);
    return { message: '所有通知已标记为已读' };
  }
}
