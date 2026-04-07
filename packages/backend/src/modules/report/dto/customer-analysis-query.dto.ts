import { IsOptional, IsIn, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class CustomerValueQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '客户级别',
    enum: ['vip', 'important', 'normal', 'potential']
  })
  @IsOptional()
  @IsIn(['vip', 'important', 'normal', 'potential'])
  level?: string;

  @ApiPropertyOptional({ description: '行业' })
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ 
    description: '排序字段',
    enum: ['contractAmount', 'paidAmount', 'valueScore'],
    default: 'valueScore'
  })
  @IsOptional()
  @IsIn(['contractAmount', 'paidAmount', 'valueScore'])
  sortBy?: string = 'valueScore';

  @ApiPropertyOptional({ description: '返回数量限制', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class DistributionQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '分布维度',
    enum: ['type', 'industry', 'level', 'status'],
    default: 'industry'
  })
  @IsOptional()
  @IsIn(['type', 'industry', 'level', 'status'])
  dimension?: 'type' | 'industry' | 'level' | 'status' = 'industry';
}

export class ActivityQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '活跃度类型',
    enum: ['active', 'inactive', 'silent'],
    default: 'inactive'
  })
  @IsOptional()
  @IsIn(['active', 'inactive', 'silent'])
  activityType?: 'active' | 'inactive' | 'silent' = 'inactive';

  @ApiPropertyOptional({ description: '沉默天数阈值', default: 30 })
  @IsOptional()
  @IsInt()
  @Min(7)
  @Max(180)
  silentDays?: number = 30;
}
