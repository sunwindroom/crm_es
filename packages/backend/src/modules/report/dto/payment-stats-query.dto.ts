import { IsOptional, IsIn, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class PaymentProgressQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '合同状态',
    enum: ['draft', 'pending', 'signed', 'executing', 'completed', 'cancelled']
  })
  @IsOptional()
  @IsIn(['draft', 'pending', 'signed', 'executing', 'completed', 'cancelled'])
  contractStatus?: string;

  @ApiPropertyOptional({ description: '最小回款率' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minPaymentRate?: number;

  @ApiPropertyOptional({ description: '最大回款率' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPaymentRate?: number;
}

export class ForecastQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ 
    description: '预测月数',
    default: 6
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  months?: number = 6;
}

export class OverdueQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ description: '最小逾期天数' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOverdueDays?: number;

  @ApiPropertyOptional({ description: '最大逾期天数' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxOverdueDays?: number;
}
