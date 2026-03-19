import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { OpportunityService } from './opportunity.service';
@Controller('opportunities')
export class OpportunityController {
  constructor(private svc: OpportunityService) {}
  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get('funnel') funnel() { return this.svc.getSalesFunnel(); }
  @Get('forecast') forecast() { return this.svc.getSalesForecast(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.svc.remove(id); return { message: '删除成功' }; }
  @Put(':id/stage') updateStage(@Param('id') id: string, @Body('stage') stage: any) { return this.svc.updateStage(id, stage); }
  @Post(':id/win') win(@Param('id') id: string) { return this.svc.markAsWon(id); }
  @Post(':id/lose') lose(@Param('id') id: string, @Body('reason') reason?: string) { return this.svc.markAsLost(id, reason); }
}