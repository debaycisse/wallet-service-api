import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyExpiry } from './create-api-key.dto';

export class RolloverApiKeyDto {
  @ApiProperty({
    description: 'ID of the expired API key to rollover',
    example: 'FGH2485K6KK79GKG9GKGK',
  })
  @IsString()
  @IsNotEmpty()
  expired_key_id: string;

  @ApiProperty({
    description: 'New expiry duration',
    enum: ApiKeyExpiry,
    example: '1M',
  })
  @IsEnum(ApiKeyExpiry)
  @IsNotEmpty()
  expiry: ApiKeyExpiry;
}
