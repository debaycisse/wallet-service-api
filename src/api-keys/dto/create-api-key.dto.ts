import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export enum ApiKeyExpiry {
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  permissions: string[];

  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}
