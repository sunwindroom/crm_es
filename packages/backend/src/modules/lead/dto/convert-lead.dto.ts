import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertLeadDto {
  @ApiProperty({ description: '客户名称（可选，默认使用线索公司名）', required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ description: '商机名称（可选，默认使用线索公司名）', required: false })
  @IsString()
  @IsOptional()
  opportunityName?: string;

  @ApiProperty({ description: '商机金额（可选，默认使用线索预算）', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  opportunityAmount?: number;
}
