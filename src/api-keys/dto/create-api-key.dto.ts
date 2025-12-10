import {
  IsString,
  IsArray,
  IsEnum,
  IsNotEmpty
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ApiKeyExpiry {
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Name for the API key',
    example: 'wallet-service',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Array of permissions',
    example: ['deposit', 'transfer', 'read'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissions: string[];

  @ApiProperty({
    description: 'Expiry duration',
    enum: ApiKeyExpiry,
    example: '1D',
  })
  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}
