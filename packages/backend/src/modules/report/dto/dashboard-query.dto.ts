import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { QueryBaseDto } from './query-base.dto';

export class DashboardQueryDto extends QueryBaseDto {
  @ApiPropertyOptional({ description: '部门ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
