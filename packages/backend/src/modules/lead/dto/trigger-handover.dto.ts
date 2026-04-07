import { IsUUID, IsOptional } from 'class-validator';

export class TriggerHandoverDto {
  @IsUUID()
  @IsOptional()
  csManagerId?: string;
}
