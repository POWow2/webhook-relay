import { createConnection } from 'typeorm';
import { Webhook } from './entities/Webhook';
import { Destination } from './entities/Destination';

export const initDatabase = async () => {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'webhook_relay',
      entities: [Webhook, Destination],
      synchronize: true,
      logging: false,
    });

    console.log('Database connection established');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Create tables if they don't exist
export const setupSchema = async () => {
  const connection = await initDatabase();
  await connection.synchronize();
  console.log('Database schema created');
};
