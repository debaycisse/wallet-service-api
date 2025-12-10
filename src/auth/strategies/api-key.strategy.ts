import {
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(
  Strategy, 'api-key'
) {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const keyData = await this.apiKeysService
      .validateApiKey(apiKey);

    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API key');
    }

    return keyData

  }
}
