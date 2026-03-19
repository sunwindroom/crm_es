import { IsString, IsNotEmpty, IsEnum, IsDate, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectType, ProjectStatus } from '../entities/project.entity';
export class CreateProjectDto {
  @IsUUID() @IsNotEmpty() customerId: string;
  @IsUUID() @IsOptional() opportunityId?: string;
  @IsUUID() @IsOptional() contractId?: string;
  @IsString() @IsNotEmpty() name: string;
  @IsEnum(ProjectType) @IsNotEmpty() type: ProjectType;
  @IsEnum(ProjectStatus) @IsOptional() status?: ProjectStatus;
  @IsUUID() @IsNotEmpty() manager: string;
  @IsDate() @Type(() => Date) @IsNotEmpty() startDate: Date;
  @IsDate() @Type(() => Date) @IsNotEmpty() endDate: Date;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() priority?: string;
}