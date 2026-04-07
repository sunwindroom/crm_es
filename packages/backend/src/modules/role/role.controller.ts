import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RoleController {
  constructor(private svc: RoleService) {}

  @Get()
  @RequirePermission('role:view')
  @ApiOperation({ summary: '获取所有角色' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @RequirePermission('role:view')
  @ApiOperation({ summary: '根据ID获取角色' })
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Get('code/:code')
  @RequirePermission('role:view')
  @ApiOperation({ summary: '根据代码获取角色' })
  findByCode(@Param('code') code: string) {
    return this.svc.findByCode(code);
  }

  @Post()
  @RequirePermission('role:create')
  @ApiOperation({ summary: '创建角色' })
  create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @RequirePermission('role:edit')
  @ApiOperation({ summary: '更新角色' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('role:delete')
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { message: '删除成功' };
  }

  @Put(':id/permissions')
  @RequirePermission('role:edit')
  @ApiOperation({ summary: '为角色分配权限' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.svc.assignPermissions(id, assignPermissionsDto);
  }

  @Get(':id/permissions')
  @RequirePermission('role:view')
  @ApiOperation({ summary: '获取角色的权限列表' })
  async getPermissions(@Param('id') id: string) {
    return this.svc.getPermissions(id);
  }
}
