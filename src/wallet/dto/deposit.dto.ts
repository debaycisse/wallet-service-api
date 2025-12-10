import { IsNumber, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DepositDto {
  @ApiProperty({
    description: 'Amount to deposit in naira (minimum 100)',
    example: 5000,
    minimum: 100,
  })
  @IsNumber()
  @Min(100)
  @IsNotEmpty()
  amount: number;
}
