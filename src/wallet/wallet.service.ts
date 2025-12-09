import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Wallet } from './entities/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  private generateWalletNumber(): string {
    return crypto.randomInt(0, 9999999999)
      .toString()
      .padStart(10, '0');
  }

  async createWallet(userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({
      userId,
      walletNumber: this.generateWalletNumber(),
      balance: 0,
    });
    return this.walletRepository.save(wallet);
  }

  async getWalletByUserId(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  async getBalance(userId: string): Promise<{ balance: number }> {
    const wallet = await this.getWalletByUserId(userId);
    return { balance: parseFloat(wallet.balance.toString()) };
  }

  async initiateDeposit(userId: string, depositDto: DepositDto) {
    const wallet = await this.getWalletByUserId(userId);
    const reference = 'TXN_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');

    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: wallet.user?.email || 'user@example.com',
          amount: depositDto.amount * 100, // Paystack uses kobo
          reference,
          callback_url: `${this.configService.get('APP_URL')}/wallet/deposit/${reference}/status`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const transaction = this.transactionRepository.create({
        reference,
        type: TransactionType.DEPOSIT,
        amount: depositDto.amount,
        status: TransactionStatus.PENDING,
        walletId: wallet.id,
        paystackAuthorizationUrl: response.data.data.authorization_url,
      });

      await this.transactionRepository.save(transaction);

      return {
        reference,
        authorization_url: response.data.data.authorization_url,
      };
    } catch (error) {
      throw new BadRequestException('Failed to initialize Paystack transaction');
    }
  }

  async handlePaystackWebhook(signature: string, payload: any) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    
    if (!secret) {
      throw new BadRequestException('Paystack secret key not configured');
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid signature');
    }

    if (payload.event === 'charge.success') {
      const reference = payload.data.reference;
      const amount = payload.data.amount / 100; // Convert from kobo

      const transaction = await this.transactionRepository.findOne({
        where: { reference },
        relations: ['wallet'],
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      // Idempotency check
      if (transaction.status === TransactionStatus.SUCCESS) {
        return { status: true };
      }

      // Use transaction to ensure atomicity
      await this.dataSource.transaction(async (manager) => {
        // Update transaction status
        transaction.status = TransactionStatus.SUCCESS;
        await manager.save(transaction);

        // Credit wallet
        transaction.wallet.balance = parseFloat(transaction.wallet.balance.toString()) + amount;
        await manager.save(transaction.wallet);
      });

      return { status: true };
    }

    return { status: true };
  }

  async getDepositStatus(userId: string, reference: string) {
    const wallet = await this.getWalletByUserId(userId);
    
    const transaction = await this.transactionRepository.findOne({
      where: { reference, walletId: wallet.id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: parseFloat(transaction.amount.toString()),
    };
  }

  async transfer(userId: string, transferDto: TransferDto) {
    const senderWallet = await this.getWalletByUserId(userId);
    const recipientWallet = await this.walletRepository.findOne({
      where: { walletNumber: transferDto.wallet_number },
    });

    if (!recipientWallet) {
      throw new BadRequestException('Recipient wallet not found');
    }

    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to your own wallet');
    }

    const senderBalance = parseFloat(senderWallet.balance.toString());
    if (senderBalance < transferDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = 'TRF_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');

    // Use transaction for atomicity
    await this.dataSource.transaction(async (manager) => {
      // Deduct from sender
      senderWallet.balance = senderBalance - transferDto.amount;
      await manager.save(senderWallet);

      // Add to recipient
      recipientWallet.balance = parseFloat(recipientWallet.balance.toString()) + transferDto.amount;
      await manager.save(recipientWallet);

      // Record transaction for sender
      const senderTransaction = this.transactionRepository.create({
        reference,
        type: TransactionType.TRANSFER,
        amount: transferDto.amount,
        status: TransactionStatus.SUCCESS,
        walletId: senderWallet.id,
        recipientWalletNumber: transferDto.wallet_number,
      });
      await manager.save(senderTransaction);
    });

    return {
      status: 'success',
      message: 'Transfer completed',
    };
  }

  async getTransactions(userId: string) {
    const wallet = await this.getWalletByUserId(userId);
    
    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });

    return transactions.map((txn) => ({
      type: txn.type,
      amount: parseFloat(txn.amount.toString()),
      status: txn.status,
    }));
  }
}


















// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { ConfigService } from '@nestjs/config';
// import { Wallet } from './entities/wallet.entity';
// import { Transaction, TransactionType, TransactionStatus } from './entities/transaction.entity';
// import { DepositDto } from './dto/deposit.dto';
// import { TransferDto } from './dto/transfer.dto';
// import axios from 'axios';
// import * as crypto from 'crypto';

// @Injectable()
// export class WalletService {
//   constructor(
//     @InjectRepository(Wallet)
//     private walletRepository: Repository<Wallet>,
//     @InjectRepository(Transaction)
//     private transactionRepository: Repository<Transaction>,
//     private configService: ConfigService,
//     private dataSource: DataSource,
//   ) {}

//   private generateWalletNumber(): string {
//     return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
//   }

//   async createWallet(userId: string): Promise<Wallet> {
//     const wallet = this.walletRepository.create({
//       userId,
//       walletNumber: this.generateWalletNumber(),
//       balance: 0,
//     });
//     return this.walletRepository.save(wallet);
//   }

//   async getWalletByUserId(userId: string): Promise<Wallet> {
//     const wallet = await this.walletRepository.findOne({
//       where: { userId },
//     });

//     if (!wallet) {
//       throw new NotFoundException('Wallet not found');
//     }

//     return wallet;
//   }

//   async getBalance(userId: string): Promise<{ balance: number }> {
//     const wallet = await this.getWalletByUserId(userId);
//     return { balance: parseFloat(wallet.balance.toString()) };
//   }

//   async initiateDeposit(userId: string, depositDto: DepositDto) {
//     const wallet = await this.getWalletByUserId(userId);
//     const reference = 'TXN_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');

//     try {
//       const response = await axios.post(
//         'https://api.paystack.co/transaction/initialize',
//         {
//           email: wallet.user?.email || 'user@example.com',
//           amount: depositDto.amount * 100, // Paystack uses kobo
//           reference,
//           callback_url: `${this.configService.get('APP_URL')}/wallet/deposit/${reference}/status`,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
//             'Content-Type': 'application/json',
//           },
//         },
//       );

//       const transaction = this.transactionRepository.create({
//         reference,
//         type: TransactionType.DEPOSIT,
//         amount: depositDto.amount,
//         status: TransactionStatus.PENDING,
//         walletId: wallet.id,
//         paystackAuthorizationUrl: response.data.data.authorization_url,
//       });

//       await this.transactionRepository.save(transaction);

//       return {
//         reference,
//         authorization_url: response.data.data.authorization_url,
//       };
//     } catch (error) {
//       throw new BadRequestException('Failed to initialize Paystack transaction');
//     }
//   }

//   async handlePaystackWebhook(signature: string, payload: any) {
//     const hash = crypto
//       .createHmac('sha512', this.configService.get<string>('PAYSTACK_SECRET_KEY'))
//       .update(JSON.stringify(payload))
//       .digest('hex');

//     if (hash !== signature) {
//       throw new BadRequestException('Invalid signature');
//     }

//     if (payload.event === 'charge.success') {
//       const reference = payload.data.reference;
//       const amount = payload.data.amount / 100; // Convert from kobo

//       const transaction = await this.transactionRepository.findOne({
//         where: { reference },
//         relations: ['wallet'],
//       });

//       if (!transaction) {
//         throw new NotFoundException('Transaction not found');
//       }

//       // Idempotency check
//       if (transaction.status === TransactionStatus.SUCCESS) {
//         return { status: true };
//       }

//       // Use transaction to ensure atomicity
//       await this.dataSource.transaction(async (manager) => {
//         // Update transaction status
//         transaction.status = TransactionStatus.SUCCESS;
//         await manager.save(transaction);

//         // Credit wallet
//         transaction.wallet.balance = parseFloat(transaction.wallet.balance.toString()) + amount;
//         await manager.save(transaction.wallet);
//       });

//       return { status: true };
//     }

//     return { status: true };
//   }

//   async getDepositStatus(userId: string, reference: string) {
//     const wallet = await this.getWalletByUserId(userId);
    
//     const transaction = await this.transactionRepository.findOne({
//       where: { reference, walletId: wallet.id },
//     });

//     if (!transaction) {
//       throw new NotFoundException('Transaction not found');
//     }

//     return {
//       reference: transaction.reference,
//       status: transaction.status,
//       amount: parseFloat(transaction.amount.toString()),
//     };
//   }

//   async transfer(userId: string, transferDto: TransferDto) {
//     const senderWallet = await this.getWalletByUserId(userId);
//     const recipientWallet = await this.walletRepository.findOne({
//       where: { walletNumber: transferDto.wallet_number },
//     });

//     if (!recipientWallet) {
//       throw new BadRequestException('Recipient wallet not found');
//     }

//     if (senderWallet.id === recipientWallet.id) {
//       throw new BadRequestException('Cannot transfer to your own wallet');
//     }

//     const senderBalance = parseFloat(senderWallet.balance.toString());
//     if (senderBalance < transferDto.amount) {
//       throw new BadRequestException('Insufficient balance');
//     }

//     const reference = 'TRF_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');

//     // Use transaction for atomicity
//     await this.dataSource.transaction(async (manager) => {
//       // Deduct from sender
//       senderWallet.balance = senderBalance - transferDto.amount;
//       await manager.save(senderWallet);

//       // Add to recipient
//       recipientWallet.balance = parseFloat(recipientWallet.balance.toString()) + transferDto.amount;
//       await manager.save(recipientWallet);

//       // Record transaction for sender
//       const senderTransaction = this.transactionRepository.create({
//         reference,
//         type: TransactionType.TRANSFER,
//         amount: transferDto.amount,
//         status: TransactionStatus.SUCCESS,
//         walletId: senderWallet.id,
//         recipientWalletNumber: transferDto.wallet_number,
//       });
//       await manager.save(senderTransaction);
//     });

//     return {
//       status: 'success',
//       message: 'Transfer completed',
//     };
//   }

//   async getTransactions(userId: string) {
//     const wallet = await this.getWalletByUserId(userId);
    
//     const transactions = await this.transactionRepository.find({
//       where: { walletId: wallet.id },
//       order: { createdAt: 'DESC' },
//     });

//     return transactions.map((txn) => ({
//       type: txn.type,
//       amount: parseFloat(txn.amount.toString()),
//       status: txn.status,
//     }));
//   }
// }
