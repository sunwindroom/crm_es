import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsDate,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProjectType } from '../../project/entities/project.entity';

export class WinOpportunityDto {
  @ApiProperty({ description: '项目名称（可选）', required: false })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiProperty({
    description: '项目类型',
    enum: ProjectType,
    required: false,
  })
  @IsEnum(ProjectType)
  @IsOptional()
  projectType?: ProjectType;

  @ApiProperty({ description: '项目开始日期' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ description: '项目结束日期' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ description: '合同名称（可选）', required: false })
  @IsString()
  @IsOptional()
  contractName?: string;

  @ApiProperty({ description: '合同金额（可选）', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  contractAmount?: number;

  @ApiProperty({ description: '回款计划期数（可选，默认3期）', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  paymentPlanCount?: number;
}
