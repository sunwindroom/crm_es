import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowUpService } from './follow-up.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { ReplyFollowUpDto } from './dto/reply-follow-up.dto';
import { CommentFollowUpDto } from './dto/comment-follow-up.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('跟进记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @RequirePermission('follow_up:create')
  @ApiOperation({ summary: '创建跟进记录' })
  async create(@Body() createFollowUpDto: CreateFollowUpDto, @CurrentUser() user: any) {
    return this.followUpService.create(createFollowUpDto, user.id);
  }

  @Post('reply')
  @RequirePermission('follow_up:create')
  @ApiOperation({ summary: '回复跟进记录' })
  async reply(@Body() replyFollowUpDto: ReplyFollowUpDto, @CurrentUser() user: any) {
    return this.followUpService.reply(replyFollowUpDto, user.id);
  }

  @Post('comment')
  @RequirePermission('follow_up:create')
  @ApiOperation({ summary: '点评跟进记录' })
  async comment(@Body() commentFollowUpDto: CommentFollowUpDto, @CurrentUser() user: any) {
    return this.followUpService.comment(commentFollowUpDto, user.id);
  }

  @Get('lead/:leadId')
  @RequirePermission('follow_up:view')
  @ApiOperation({ summary: '根据线索ID获取跟进记录' })
  async findByLead(@Param('leadId') leadId: string, @CurrentUser() user: any) {
    return this.followUpService.findByLead(leadId, user.id);
  }

  @Get(':id')
  @RequirePermission('follow_up:view')
  @ApiOperation({ summary: '获取跟进记录详情' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.followUpService.findOne(id, user.id);
  }

  @Delete(':id')
  @RequirePermission('follow_up:delete')
  @ApiOperation({ summary: '删除跟进记录' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    await this.followUpService.remove(id, user.id);
    return { message: '删除成功' };
  }
}
