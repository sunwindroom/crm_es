import { IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class ProjectProgressQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '项目状态',
    enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled']
  })
  @IsOptional()
  @IsIn(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @ApiPropertyOptional({ description: '项目经理ID' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class TimesheetQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ description: '项目ID' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
