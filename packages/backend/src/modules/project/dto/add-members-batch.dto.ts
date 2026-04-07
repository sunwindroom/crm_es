import { IsArray, IsString, IsNotEmpty, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMembersBatchDto {
  @ApiProperty({ description: '用户ID列表，最多20个', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: '至少需要添加一个成员' })
  @ArrayMaxSize(20, { message: '单次最多添加20个成员' })
  @IsNotEmpty()
  userIds: string[];
}

export class AddMembersBatchResponseDto {
  @ApiProperty({ description: '操作结果消息' })
  message: string;

  @ApiProperty({ description: '成功添加数量' })
  successCount: number;

  @ApiProperty({ description: '失败数量' })
  failedCount: number;

  @ApiProperty({
    description: '失败用户列表',
    type: 'array',
    example: [{ userId: 'uuid', reason: '用户已是项目成员' }]
  })
  failedUsers: Array<{ userId: string; reason: string }>;
}
