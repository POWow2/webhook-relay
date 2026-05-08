import { config } from 'dotenv';
import process from 'process';

config();

export interface EnvironmentConfig {
  databaseUrl: string;
  port: number;
  maxRetries: number;
  retryDelay: number;
}

export const config: EnvironmentConfig = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/webhook_relay',
  port: parseInt(process.env.PORT || '3000', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
};
