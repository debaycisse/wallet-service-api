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
import { User } from '../users/entities/user.entity'

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

  private hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex');
  }

  private verifyApiKey(plainTextKey: string, hashedKey: string): boolean {
    const hashToCompare = this.hashApiKey(plainTextKey);
    return hashToCompare === hashedKey;
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

    // Generate plain text API key
    const plainTextApiKey = this.generateApiKey();
    
    // Hash the API key before storing
    const hashedApiKey = this.hashApiKey(plainTextApiKey);

    const apiKey = this.apiKeysRepository.create({
      name: createDto.name,
      key: hashedApiKey,
      permissions: createDto.permissions,
      expiresAt: this.calculateExpiry(createDto.expiry),
      userId,
    });

    const saved = await this.apiKeysRepository.save(apiKey);

    return {
      api_key: plainTextApiKey,
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

    // Generate new plain text API key
    const plainTextApiKey = this.generateApiKey();
    
    // Hash the new API key
    const hashedApiKey = this.hashApiKey(plainTextApiKey);

    const newApiKey = this.apiKeysRepository.create({
      name: expiredKey.name,
      key: hashedApiKey,
      permissions: expiredKey.permissions,
      expiresAt: this.calculateExpiry(rolloverDto.expiry),
      userId,
    });

    const saved = await this.apiKeysRepository.save(newApiKey);

    return {
      api_key: plainTextApiKey,
      expires_at: saved.expiresAt,
    };
  }

  async validateApiKey(plainTextKey: string) {
    // Hash the incoming plain text key
    const hashedKey = this.hashApiKey(plainTextKey);

    // Find API key by hashed version
    const apiKey = await this.apiKeysRepository.findOne({
      where: { key: hashedKey },
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
