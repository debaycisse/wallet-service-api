import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';

export const DepositSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Initialize wallet deposit via Paystack' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Deposit initialized',
      schema: {
        properties: {
          reference: { type: 'string' },
          authorization_url: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const GetBalanceSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get wallet balance' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Wallet balance retrieved',
      schema: {
        properties: {
          balance: { type: 'number' },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const TransferSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Transfer funds to another wallet' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Transfer completed',
      schema: {
        properties: {
          status: { type: 'string' },
          message: { type: 'string' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Insufficient balance or invalid recipient' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const GetTransactionsSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get transaction history' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Transaction history retrieved',
      schema: {
        type: 'array',
        items: {
          properties: {
            type: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string' },
          },
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const VerifyDepositSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Verify deposit status (manual check)' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Deposit status retrieved',
      schema: {
        properties: {
          reference: { type: 'string' },
          status: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Transaction not found' }),
  );
};

export const PaystackWebhookSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Paystack webhook endpoint' }),
    ApiResponse({
      status: 200,
      description: 'Webhook processed',
      schema: {
        properties: {
          status: { type: 'boolean' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Invalid signature' }),
  );
};