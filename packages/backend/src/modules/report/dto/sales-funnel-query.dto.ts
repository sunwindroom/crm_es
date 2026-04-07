import { IsOptional, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class SalesFunnelQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '行业筛选',
    example: 'IT'
  })
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ 
    description: '商机阶段',
    enum: ['initial', 'requirement', 'proposal', 'negotiation', 'contract']
  })
  @IsOptional()
  @IsIn(['initial', 'requirement', 'proposal', 'negotiation', 'contract'])
  stage?: string;
}

export class ConversionRateQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
