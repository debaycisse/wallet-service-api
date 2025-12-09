import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKeyStrategy } from '../auth/strategies/api-key.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    forwardRef(() => ApiKeysModule),
  ],
  providers: [WalletService, ApiKeyStrategy],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
