import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoseOpportunityDto {
  @ApiProperty({ description: '输单原因' })
  @IsString()
  @IsNotEmpty({ message: '输单原因不能为空' })
  lostReason: string;
}
