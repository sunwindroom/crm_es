import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ContractService } from './contract.service';
@Controller('contracts')
export class ContractController {
  constructor(private svc: ContractService) {}
  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get('expiring') expiring(@Query('days') d?: number) { return this.svc.getExpiringContracts(Number(d)||30); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.svc.remove(id); return { message: '删除成功' }; }
  @Post(':id/submit') submit(@Param('id') id: string) { return this.svc.submitForApproval(id); }
  @Post(':id/approve') approve(@Param('id') id: string, @Request() req: any) { return this.svc.approve(id, req.user.userId); }
  @Post(':id/reject') reject(@Param('id') id: string) { return this.svc.reject(id); }
  @Post(':id/sign') sign(@Param('id') id: string, @Body('signDate') d?: Date) { return this.svc.sign(id, d); }
}