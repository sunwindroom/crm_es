import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private svc: CustomerService) {}
  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.userId); }
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get(':id/360') get360(@Param('id') id: string) { return this.svc.getCustomer360View(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') async remove(@Param('id') id: string) { await this.svc.remove(id); return { message: '删除成功' }; }
  @Post(':id/contacts') addContact(@Param('id') id: string, @Body() data: any) { return this.svc.addContact(id, data); }
  @Get(':id/contacts') getContacts(@Param('id') id: string) { return this.svc.getContacts(id); }
  @Put('contacts/:cid') updateContact(@Param('cid') cid: string, @Body() data: any) { return this.svc.updateContact(cid, data); }
  @Delete('contacts/:cid') async removeContact(@Param('cid') cid: string) { await this.svc.removeContact(cid); return { message: '删除成功' }; }
}