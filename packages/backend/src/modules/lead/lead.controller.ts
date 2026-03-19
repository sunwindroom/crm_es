import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { LeadService } from './lead.service';

@Controller('leads')
export class LeadController {
  constructor(private readonly svc: LeadService) {}
  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.svc.remove(id); return { message: '删除成功' }; }
  @Post(':id/assign') assign(@Param('id') id: string, @Body('userId') userId: string) { return this.svc.assign(id, userId); }
  @Post('batch-assign') batchAssign(@Body() body: { leadIds: string[]; userId: string }) { return this.svc.batchAssign(body.leadIds, body.userId); }
  @Post(':id/convert') convert(@Param('id') id: string, @Body() data: any) { return this.svc.convert(id, data); }
  @Post(':id/lost') markLost(@Param('id') id: string, @Body('reason') reason: string) { return this.svc.markAsLost(id, reason); }
}
