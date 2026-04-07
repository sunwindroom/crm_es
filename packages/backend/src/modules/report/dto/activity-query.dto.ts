import { IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class FrequencyQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '跟进类型',
    enum: ['call', 'email', 'visit', 'meeting', 'other']
  })
  @IsOptional()
  @IsIn(['call', 'email', 'visit', 'meeting', 'other'])
  type?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class EffectivenessQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '资源类型',
    enum: ['lead', 'customer', 'opportunity']
  })
  @IsOptional()
  @IsIn(['lead', 'customer', 'opportunity'])
  resourceType?: string;
}
