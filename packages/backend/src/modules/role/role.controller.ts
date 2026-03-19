import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { RoleService } from './role.service';
@Controller('roles')
export class RoleController {
  constructor(private svc: RoleService) {}
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get('code/:code') findByCode(@Param('code') code: string) { return this.svc.findByCode(code); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.svc.remove(id); return { message: '删除成功' }; }
}