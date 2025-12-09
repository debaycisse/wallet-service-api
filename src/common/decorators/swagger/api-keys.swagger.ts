import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

export const CreateApiKeySwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new API key' }),
    ApiBody({
      schema: {
        properties: {
          name: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
          expiry: { type: 'string', enum: ['1H', '1D', '1M', '1Y'] },
        },
      },
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 201,
      description: 'API key created successfully',
      schema: {
        properties: {
          api_key: { type: 'string' },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Maximum 5 active keys allowed' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};

export const RolloverApiKeySwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Rollover an expired API key' }),
    ApiBearerAuth(),
    ApiResponse({
      status: 201,
      description: 'New API key created with same permissions',
      schema: {
        properties: {
          api_key: { type: 'string' },
          expires_at: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Key not expired or not found' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
};