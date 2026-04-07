import {
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyFollowUpDto {
  @ApiProperty({ description: '跟进记录ID（被回复的记录）' })
  @IsUUID()
  @IsNotEmpty({ message: '跟进记录ID不能为空' })
  parentId: string;

  @ApiProperty({ description: '回复内容' })
  @IsString()
  @IsNotEmpty({ message: '回复内容不能为空' })
  content: string;
}
