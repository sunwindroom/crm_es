import { IsArray, IsNotEmpty, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({
    description: '权限ID列表',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray({ message: '权限ID列表必须是数组' })
  @ArrayNotEmpty({ message: '权限ID列表不能为空' })
  @IsNotEmpty({ message: '权限ID列表不能为空' })
  permissionIds: string[];
}
