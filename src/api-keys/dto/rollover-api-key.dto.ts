import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiKeyExpiry } from './create-api-key.dto';

export class RolloverApiKeyDto {
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}
