import { createConnection } from 'typeorm';
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Entity('webhooks')
class Webhook extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string> | null;

  @Column({ type: 'text', nullable: true })
  payload: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

@Entity('destinations')
class Destination extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string> | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

export const connectToDatabase = async () => {
  return await createConnection({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'webhook_relay',
    entities: [Webhook, Destination],
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  });
};
