import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtOrApiKeyGuard } from '../auth/guards/jwt-or-api-key.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import {
  DepositSwagger,
  GetBalanceSwagger,
  TransferSwagger,
  GetTransactionsSwagger,
  VerifyDepositSwagger,
  PaystackWebhookSwagger,
} from '../common/decorators/swagger/wallet.swagger';

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Post('deposit')
  @UseGuards(JwtOrApiKeyGuard, PermissionsGuard)
  @Permissions('deposit')
  @DepositSwagger()
  async deposit(@Req() req, @Body() depositDto: DepositDto) {
    return this.walletService.initiateDeposit(req.user.id, depositDto);
  }

  @Post('paystack/webhook')
  @PaystackWebhookSwagger()
  async paystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.walletService.handlePaystackWebhook(signature, payload);
  }

  @Get('deposit/:reference/status')
  @UseGuards(JwtOrApiKeyGuard)
  @VerifyDepositSwagger()
  async getDepositStatus(@Req() req, @Param('reference') reference: string) {
    return this.walletService.getDepositStatus(req.user.id, reference);
  }

  @Get('balance')
  @UseGuards(JwtOrApiKeyGuard, PermissionsGuard)
  @Permissions('read')
  @GetBalanceSwagger()
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Post('transfer')
  @UseGuards(JwtOrApiKeyGuard, PermissionsGuard)
  @Permissions('transfer')
  @TransferSwagger()
  async transfer(@Req() req, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.id, transferDto);
  }

  @Get('transactions')
  @UseGuards(JwtOrApiKeyGuard, PermissionsGuard)
  @Permissions('read')
  @GetTransactionsSwagger()
  async getTransactions(@Req() req) {
    return this.walletService.getTransactions(req.user.id);
  }
}
