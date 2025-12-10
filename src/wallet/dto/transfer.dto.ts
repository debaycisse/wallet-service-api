import {
  IsString,
  IsNumber,
  Min,
  IsNotEmpty,
  Length
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty({
    description: '10-digit wallet number of recipient',
    example: '4566678954',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10)
  wallet_number: string;

  @ApiProperty({
    description: 'Amount to transfer (minimum 1)',
    example: 3000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}
