import { IsNumber, Min, IsNotEmpty } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @Min(100)
  @IsNotEmpty()
  amount: number;
}
