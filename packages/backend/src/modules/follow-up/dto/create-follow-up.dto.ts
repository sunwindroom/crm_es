import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDate,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFollowUpDto {
  @ApiProperty({ description: '线索ID' })
  @IsUUID()
  @IsNotEmpty({ message: '线索ID不能为空' })
  leadId: string;

  @ApiProperty({ description: '跟进内容' })
  @IsString()
  @IsNotEmpty({ message: '跟进内容不能为空' })
  content: string;

  @ApiProperty({ description: '下一步计划', required: false })
  @IsString()
  @IsOptional()
  nextAction?: string;

  @ApiProperty({ description: '下一步计划日期', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  nextActionDate?: Date;
}
