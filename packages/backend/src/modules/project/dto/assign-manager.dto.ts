import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManagerDto {
  @ApiProperty({ description: '项目经理用户ID' })
  @IsUUID()
  @IsNotEmpty()
  managerId: string;
}
