import { IsUUID, IsNotEmpty, IsNumber, IsDate, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CreatePaymentPlanDto {
  @IsUUID() @IsNotEmpty() contractId: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDate() @Type(() => Date) @IsNotEmpty() plannedDate: Date;
  @IsString() @IsOptional() paymentMethod?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() remark?: string;
}