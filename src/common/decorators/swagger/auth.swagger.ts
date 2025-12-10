import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const GoogleAuthSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Initiate Google OAuth sign-in' }),
    ApiResponse({ status: 302, description: 'Redirects to Google OAuth' }),
  );
};

export const GoogleCallbackSwagger = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Google OAuth callback' }),
    ApiResponse({
      status: 200,
      description: 'Returns JWT token',
      schema: {
        properties: {
          access_token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    }),
  );
};
