import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config({ path: join(__dirname, '../.env') });

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/webhook_relay',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  retryAttempts: process.env.RETRY_ATTEMPTS ? parseInt(process.env.RETRY_ATTEMPTS, 10) : 3,
  retryDelay: process.env.RETRY_DELAY ? parseInt(process.env.RETRY_DELAY, 10) : 1000,
};
