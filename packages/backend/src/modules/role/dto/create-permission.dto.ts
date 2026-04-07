import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称', example: '查看用户' })
  @IsString()
  @IsNotEmpty({ message: '权限名称不能为空' })
  @MaxLength(100, { message: '权限名称长度不能超过100' })
  name: string;

  @ApiProperty({ description: '权限代码', example: 'user:view' })
  @IsString()
  @IsNotEmpty({ message: '权限代码不能为空' })
  @MaxLength(100, { message: '权限代码长度不能超过100' })
  code: string;

  @ApiProperty({ description: '资源名称', example: 'user' })
  @IsString()
  @IsNotEmpty({ message: '资源名称不能为空' })
  @MaxLength(50, { message: '资源名称长度不能超过50' })
  resource: string;

  @ApiProperty({
    description: '操作类型',
    enum: ['view', 'create', 'edit', 'delete', 'assign', 'approve'],
    example: 'view',
  })
  @IsEnum(['view', 'create', 'edit', 'delete', 'assign', 'approve'], {
    message: '操作类型必须是 view, create, edit, delete, assign, approve 之一',
  })
  action: 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'approve';

  @ApiProperty({ description: '权限描述', required: false, example: '查看用户列表和详情' })
  @IsString()
  @IsOptional()
  description?: string;
}
