import { createConnection, getConnection } from 'typeorm';
import { Webhook } from './entities/Webhook';
import { Destination } from './entities/Destination';

export async function setupPostgreSQLConnection() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'webhook_relay',
      entities: [Webhook, Destination],
      synchronize: true,
      logging: false,
    });

    console.log('PostgreSQL connection established');
    return connection;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

// Create tables if they don't exist
export async function createSchema() {
  try {
    const connection = getConnection();
    const webhooksTable = connection.getRepository(Webhook);
    const destinationsTable = connection.getRepository(Destination);
    
    // Tables are automatically created by TypeORM with synchronize: true
    console.log('Schema created successfully');
  } catch (error) {
    console.error('Failed to create schema:', error);
    throw error;
  }
}
