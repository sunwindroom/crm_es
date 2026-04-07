import { IsOptional, IsIn, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class PerformanceQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '统计周期',
    enum: ['month', 'quarter', 'year'],
    default: 'month'
  })
  @IsOptional()
  @IsIn(['month', 'quarter', 'year'])
  period?: 'month' | 'quarter' | 'year' = 'month';

  @ApiPropertyOptional({ description: '用户ID(查询指定用户业绩)' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class TeamPerformanceQueryDto extends PerformanceQueryDto {
  @ApiPropertyOptional({ description: '团队负责人ID' })
  @IsOptional()
  @IsUUID()
  teamLeaderId?: string;
}

export class TrendQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '趋势类型',
    enum: ['month', 'quarter'],
    default: 'month'
  })
  @IsOptional()
  @IsIn(['month', 'quarter'])
  trendType?: 'month' | 'quarter' = 'month';
}
