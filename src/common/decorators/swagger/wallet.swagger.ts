import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';

export const DepositSwagger = () => {
  return applyDecorators(
    ApiOperation({ 
      summary: 'Initialize wallet deposit via Paystack'
    }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiBody({
      description: 'Deposit amount',
      schema: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to deposit (minimum 100)',
            example: 5000,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Deposit initialized',
      schema: {
        properties: {
          reference: { type: 'string', example: 'TXN_1234567890_abcdef' },
          authorization_url: {
            type: 'string',
            example: 'https://checkout.paystack.com/xxxxx'
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Invalid amount' }),
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
          balance: { type: 'number', example: 15000 },
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
    ApiBody({
      description: 'Transfer details',
      schema: {
        type: 'object',
        required: ['wallet_number', 'amount'],
        properties: {
          wallet_number: {
            type: 'string',
            description: '10-digit wallet number of recipient',
            example: '4566678954',
            minLength: 10,
            maxLength: 10,
          },
          amount: {
            type: 'number',
            description: 'Amount to transfer (minimum 1)',
            example: 3000,
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Transfer completed',
      schema: {
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Transfer completed' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Insufficient balance or invalid recipient'
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const GetTransactionsSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get transaction history with pagination' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (default: 10, max: 100)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction history retrieved',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', example: 'deposit' },
                amount: { type: 'number', example: 5000 },
                status: { type: 'string', example: 'success' },
              },
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              total: { type: 'number', example: 45 },
              totalPages: { type: 'number', example: 5 },
            },
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
          reference: { type: 'string', example: 'TXN_1234567890_abcdef' },
          status: {
            type: 'string',
            example: 'success',
            enum: ['pending', 'success', 'failed']
          },
          amount: { type: 'number', example: 5000 },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Transaction not found' }),
  );
};

export const PaystackWebhookSwagger = () => {
  return applyDecorators(
    ApiOperation({ 
      summary: 'Paystack webhook endpoint',
      description: 'Receives payment notifications from Paystack. Signature verification required.',
    }),
    ApiBody({
      description: 'Paystack webhook payload',
      schema: {
        type: 'object',
        properties: {
          event: { 
            type: 'string', 
            example: 'charge.success',
            description: 'Event type from Paystack',
          },
          data: {
            type: 'object',
            properties: {
              reference: { 
                type: 'string', 
                example: 'TXN_1234567890_abcdef',
                description: 'Transaction reference',
              },
              amount: { 
                type: 'number', 
                example: 500000,
                description: 'Amount in kobo (multiply by 100)',
              },
              status: { 
                type: 'string', 
                example: 'success',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Webhook processed',
      schema: {
        properties: {
          status: { type: 'boolean', example: true },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Invalid signature' }),
  );
};

export const GetWalletSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get wallet details' }),
    ApiBearerAuth(),
    ApiSecurity('api-key'),
    ApiResponse({
      status: 200,
      description: 'Wallet details retrieved',
      schema: {
        properties: {
          id: { type: 'string', example: '123e4567-e89b-12d3-a4' },
          userId: { type: 'string', example: '123e4567-e89b-12d3-a4' },
          walletNumber: { type: 'string', example: '12345678901' },
          balance: { type: 'number', example: 15000 },
        },
      },
    }),
  )
}
