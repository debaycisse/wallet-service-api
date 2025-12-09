import { IsString, IsNumber, Min, IsNotEmpty, Length } from 'class-validator';

export class TransferDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 13)
  wallet_number: string;

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;
}
