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
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('权限管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @RequirePermission('permission:view')
  @ApiOperation({ summary: '获取所有权限' })
  async findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @RequirePermission('permission:view')
  @ApiOperation({ summary: '根据ID获取权限' })
  async findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Post()
  @RequirePermission('permission:create')
  @ApiOperation({ summary: '创建权限' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Put(':id')
  @RequirePermission('permission:edit')
  @ApiOperation({ summary: '更新权限' })
  async update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('permission:delete')
  @ApiOperation({ summary: '删除权限' })
  async remove(@Param('id') id: string) {
    await this.permissionService.remove(id);
    return { message: '删除成功' };
  }
}
