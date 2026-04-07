import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignLeadDto {
  @ApiProperty({ description: '目标用户ID（下级用户）' })
  @IsUUID()
  @IsNotEmpty({ message: '目标用户ID不能为空' })
  userId: string;

  @ApiProperty({ description: '分配备注（可选）', required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}
