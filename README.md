# Wallet Service Backend App

A backend wallet service built with NestJS that allows users to deposit money using Paystack, manage wallet balances, view transaction history, and transfer funds to other users.

## Features

- ✅ Google OAuth authentication with JWT
- ✅ API key-based authentication for service-to-service access
- ✅ Paystack deposit integration with webhook handling
- ✅ Wallet-to-wallet transfers
- ✅ Transaction history
- ✅ Permission-based API key access
- ✅ Maximum 5 active API keys per user
- ✅ API key expiration and rollover
- ✅ Interactive Swagger documentation

## Tech Stack

- NestJS
- TypeORM
- PostgreSQL
- Passport.js (JWT & Custom strategies)
- Paystack API
- Swagger UI

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL
- Google OAuth credentials
- Paystack account (test mode)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=wallet_service

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=7d

PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public

APP_URL=http://localhost:3000
```

4. Set up PostgreSQL database:
```sql
CREATE DATABASE postgres;
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/docs

## API Testing Guide

### 1. Authentication

#### Get JWT Token via Google OAuth

1. Visit: `GET http://localhost:3000/auth/google`
2. Complete Google sign-in
3. Receive JWT token in response

### 2. Create API Key

**Request:**
```bash
POST /keys/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "wallet-service",
  "permissions": ["deposit", "transfer", "read"],
  "expiry": "1D"
}
```

**Response:**
```json
{
  "api_key": "sk_live_xxxxx",
  "expires_at": "2025-12-10T12:00:00Z"
}
```

### 3. Wallet Deposit (Paystack)

**Using JWT:**
```bash
POST /wallet/deposit
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "amount": 5000
}
```

**Using API Key:**
```bash
POST /wallet/deposit
x-api-key: sk_live_xxxxx
Content-Type: application/json

{
  "amount": 5000
}
```

**Response:**
```json
{
  "reference": "TXN_1234567890_abcdef",
  "authorization_url": "https://paystack.co/checkout/..."
}
```

### 4. Get Wallet Balance

```bash
GET /wallet/balance
Authorization: Bearer YOUR_JWT_TOKEN
# OR
x-api-key: sk_live_xxxxx
```

**Response:**
```json
{
  "balance": 15000
}
```

### 5. Wallet Transfer

```bash
POST /wallet/transfer
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "wallet_number": "4566678954356",
  "amount": 3000
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Transfer completed"
}
```

### 6. Transaction History

```bash
GET /wallet/transactions?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `page` (optional): Page number, default is 1
- `limit` (optional): Items per page, default is 10, max is 100

**Response:**
```json
{
  "data": [
    {
      "type": "deposit",
      "amount": 5000,
      "status": "success"
    },
    {
      "type": "transfer",
      "amount": 3000,
      "status": "success"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### 7. Verify Deposit Status

```bash
GET /wallet/deposit/{reference}/status
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "reference": "TXN_1234567890_abcdef",
  "status": "success",
  "amount": 5000
}
```

### 8. Rollover Expired API Key

```bash
POST /keys/rollover
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "expired_key_id": "FGH2485K6KK79GKG9GKGK",
  "expiry": "1M"
}
```

## Paystack Webhook Testing

### Local Testing with ngrok

1. Install ngrok:
```bash
npm install -g ngrok
```

2. Start ngrok:
```bash
ngrok http 3000
```

3. Configure webhook in Paystack dashboard:
```
https://your-ngrok-url.ngrok.io/wallet/paystack/webhook
```

### Webhook Payload Example

Paystack will send:
```json
{
  "event": "charge.success",
  "data": {
    "reference": "TXN_1234567890_abcdef",
    "amount": 500000,
    "status": "success"
  }
}
```

## API Key Permissions

- `deposit` - Allow wallet deposits
- `transfer` - Allow wallet transfers
- `read` - Allow reading balance and transactions

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (insufficient balance, invalid input)
- `401` - Unauthorized (missing or invalid auth)
- `403` - Forbidden (missing permissions)
- `404` - Not Found

## Security Features

- ✅ Webhook signature verification
- ✅ API key expiration enforcement
- ✅ Maximum 5 active keys per user
- ✅ Permission-based access control
- ✅ Atomic transactions for transfers
- ✅ Idempotent webhook handling

## Project Structure

```
src/
├── auth/
│   ├── strategies/
│   │   ├── google.strategy.ts
│   │   ├── jwt.strategy.ts
│   │   └── api-key.strategy.ts
│   ├── guards/
│   │   ├── jwt-or-api-key.guard.ts
│   │   └── permissions.guard.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
├── users/
│   ├── entities/
│   │   └── user.entity.ts
│   ├── users.service.ts
│   └── users.module.ts
├── wallet/
│   ├── entities/
│   │   ├── wallet.entity.ts
│   │   └── transaction.entity.ts
│   ├── dto/
│   │   ├── deposit.dto.ts
│   │   └── transfer.dto.ts
│   ├── wallet.service.ts
│   ├── wallet.controller.ts
│   └── wallet.module.ts
├── api-keys/
│   ├── entities/
│   │   └── api-key.entity.ts
│   ├── dto/
│   │   ├── create-api-key.dto.ts
│   │   └── rollover-api-key.dto.ts
│   ├── api-keys.service.ts
│   ├── api-keys.controller.ts
│   └── api-keys.module.ts
├── config/
│   └── config.validation.ts
└── common/
    └── decorators/
        ├── permissions.decorator.ts
        └── swagger/
            ├── auth.swagger.ts
            ├── api-keys.swagger.ts
            └── wallet.swagger.ts
```

## Testing with Swagger

1. Navigate to http://localhost:3000/api
2. Click "Authorize" button
3. Enter your JWT token or API key
4. Test endpoints interactively

## Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (unique)
- `name`
- `googleId` (unique)
- `createdAt`
- `updatedAt`

### Wallets Table
- `id` (UUID, PK)
- `walletNumber` (unique, 13 digits)
- `balance` (decimal)
- `userId` (FK)
- `createdAt`
- `updatedAt`

### Transactions Table
- `id` (UUID, PK)
- `reference` (unique)
- `type` (deposit/transfer)
- `amount` (decimal)
- `status` (pending/success/failed)
- `walletId` (FK)
- `recipientWalletNumber` (nullable)
- `paystackAuthorizationUrl` (nullable)
- `createdAt`

### API Keys Table
- `id` (UUID, PK)
- `name`
- `key` (unique)
- `permissions` (array)
- `expiresAt`
- `revoked` (boolean)
- `userId` (FK)
- `createdAt`

## License

MIT