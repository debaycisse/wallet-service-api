import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto, ApiKeyExpiry } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
  ) {}

  private calculateExpiry(expiry: ApiKeyExpiry): Date {
    const now = new Date();
    switch (expiry) {
      case ApiKeyExpiry.ONE_HOUR:
        return new Date(now.getTime() + 60 * 60 * 1000);
      case ApiKeyExpiry.ONE_DAY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ApiKeyExpiry.ONE_MONTH:
        return new Date(now.setMonth(now.getMonth() + 1));
      case ApiKeyExpiry.ONE_YEAR:
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }

  private generateApiKey(): string {
    return 'sk_live_' + crypto.randomBytes(32).toString('hex');
  }

  async createApiKey(userId: string, createDto: CreateApiKeyDto) {

    // Count non-revoked and non-expired keys
    const nonExpiredKeys = await this.apiKeysRepository
      .createQueryBuilder('apiKey')
      .where('apiKey.userId = :userId', { userId })
      .andWhere('apiKey.revoked = :revoked', { revoked: false })
      .andWhere('apiKey.expiresAt > :now', { now: new Date() })
      .getCount();

    if (nonExpiredKeys >= 5) {
      throw new BadRequestException(
        'Maximum of 5 active API keys allowed per user'
      );
    }

    const apiKey = this.apiKeysRepository.create({
      name: createDto.name,
      key: this.generateApiKey(),
      permissions: createDto.permissions,
      expiresAt: this.calculateExpiry(createDto.expiry),
      userId,
    });

    const saved = await this.apiKeysRepository.save(apiKey);

    return {
      api_key: saved.key,
      expires_at: saved.expiresAt,
    };
  }

  async rolloverApiKey(userId: string, rolloverDto: RolloverApiKeyDto) {
    const expiredKey = await this.apiKeysRepository.findOne({
      where: {
        id: rolloverDto.expired_key_id,
        userId,
      },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found');
    }

    if (expiredKey.expiresAt > new Date()) {
      throw new BadRequestException('API key has not expired yet');
    }

    // Count current active keys
    const nonExpiredKeys = await this.apiKeysRepository
      .createQueryBuilder('apiKey')
      .where('apiKey.userId = :userId', { userId })
      .andWhere('apiKey.revoked = :revoked', { revoked: false })
      .andWhere('apiKey.expiresAt > :now', { now: new Date() })
      .getCount();

    if (nonExpiredKeys >= 5) {
      throw new BadRequestException('Maximum of 5 active API keys allowed per user');
    }

    const newApiKey = this.apiKeysRepository.create({
      name: expiredKey.name,
      key: this.generateApiKey(),
      permissions: expiredKey.permissions,
      expiresAt: this.calculateExpiry(rolloverDto.expiry),
      userId,
    });

    const saved = await this.apiKeysRepository.save(newApiKey);

    return {
      api_key: saved.key,
      expires_at: saved.expiresAt,
    };
  }

  async validateApiKey(key: string): Promise<any> {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { key },
      relations: ['user', 'user.wallet'],
    });

    if (!apiKey) {
      return null;
    }

    if (apiKey.revoked) {
      return null;
    }

    if (apiKey.expiresAt < new Date()) {
      return null;
    }

    return {
      ...apiKey.user,
      permissions: apiKey.permissions,
    };
  }
}
