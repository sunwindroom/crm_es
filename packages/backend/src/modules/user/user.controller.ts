import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';
import { UserStatus } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() dto: CreateUserDto) { return this.userService.create(dto); }

  @Get()
  async findAll(@Query() q: QueryUserDto) { return this.userService.findAll(q); }

  @Get('me')
  async getMe(@Request() req: any) { return req.user.user; }

  @Get('sales')
  async getSales(@Query('keyword') kw?: string) { return this.userService.getSalesUsers(kw); }

  @Get('subordinates')
  async getSubordinates(@Request() req: any) { return this.userService.getSubordinates(req.user.userId); }

  @Get('superior')
  async getSuperior(@Request() req: any) { return this.userService.getSuperior(req.user.userId); }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.userService.findOne(id); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.userService.update(id, dto); }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: UserStatus) {
    return this.userService.updateStatus(id, status);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    await this.userService.resetPassword(id, newPassword);
    return { message: '密码重置成功' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: '删除成功' };
  }
}
