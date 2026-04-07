import {
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CommentFollowUpDto {
  @ApiProperty({ description: '跟进记录ID（被点评的记录）' })
  @IsUUID()
  @IsNotEmpty({ message: '跟进记录ID不能为空' })
  parentId: string;

  @ApiProperty({ description: '点评内容' })
  @IsString()
  @IsNotEmpty({ message: '点评内容不能为空' })
  content: string;
}
