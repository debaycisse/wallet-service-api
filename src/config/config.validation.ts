export function validateEnvironmentVariables(): void {
  const requiredEnvVars = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
    'JWT_SECRET',
    'JWT_EXPIRATION',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
    'APP_URL',
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file.`,
    );
  }

  console.log('✅ All required environment variables are configured');
}

// Optional: Type-safe configuration interface
export interface AppConfig {
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  jwt: {
    secret: string;
    expiration: string;
  };
  paystack: {
    secretKey: string;
    publicKey: string;
  };
  app: {
    url: string;
  };
}

export function getConfig(): AppConfig {
  return {
    database: {
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT!, 10),
      user: process.env.DATABASE_USER!,
      password: process.env.DATABASE_PASSWORD!,
      name: process.env.DATABASE_NAME!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiration: process.env.JWT_EXPIRATION!,
    },
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY!,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY!,
    },
    app: {
      url: process.env.APP_URL!,
    },
  };
}