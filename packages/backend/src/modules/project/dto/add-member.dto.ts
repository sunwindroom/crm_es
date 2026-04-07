import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProjectMemberRole {
  MANAGER = 'manager',
  MEMBER = 'member',
}

export class AddMemberDto {
  @ApiProperty({ description: '用户ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: '成员角色',
    enum: ProjectMemberRole,
    default: ProjectMemberRole.MEMBER
  })
  @IsEnum(ProjectMemberRole)
  @IsOptional()
  role?: ProjectMemberRole;
}
