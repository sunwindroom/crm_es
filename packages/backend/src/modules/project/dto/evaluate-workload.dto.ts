import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class EvaluateWorkloadDto {
  @IsInt()
  @Min(1)
  estimatedHours: number;

  @IsInt()
  @Min(1)
  estimatedPeople: number;

  @IsOptional()
  @IsString()
  workloadEvaluation?: string;
}
