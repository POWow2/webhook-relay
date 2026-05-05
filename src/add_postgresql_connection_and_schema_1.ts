import { createConnection, getConnectionOptions } from 'typeorm';
import { Webhook } from './entities/Webhook';
import { Destination } from './entities/Destination';

export async function setupDatabase() {
  try {
    const connectionOptions = await getConnectionOptions();
    const connection = await createConnection({
      ...connectionOptions,
      entities: [Webhook, Destination],
    });
    
    console.log('Database connected successfully');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Create tables if they don't exist
export async function createSchema(connection: any) {
  try {
    await connection.synchronize();
    console.log('Database schema created/updated successfully');
  } catch (error) {
    console.error('Failed to create schema:', error);
    throw error;
  }
}
