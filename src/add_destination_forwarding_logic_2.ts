import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';

interface WebhookEvent {
  id: string;
  payload: any;
  createdAt: Date;
}

interface Destination {
  id: string;
  url: string;
  secret: string;
}

export class DestinationForwardingService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async forwardWebhookToDestinations(event: WebhookEvent): Promise<void> {
    const client = await this.pool.connect();
    try {
      const destinations = await client.query<Destination>(
        'SELECT id, url, secret FROM destinations WHERE active = true'
      );
      
      for (const dest of destinations.rows) {
        try {
          await axios.post(dest.url, {
            event_id: event.id,
            payload: event.payload,
            timestamp: event.createdAt
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': this.generateSignature(dest.secret, event.payload)
            }
          });
        } catch (error) {
          console.error(`Failed to forward to destination ${dest.id}:`, error);
        }
      }
    } finally {
      client.release();
    }
  }

  private generateSignature(secret: string, payload: any): string {
    // Simple HMAC signature generation
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

export const createDestinationForwardingMiddleware = (pool: Pool) => {
  const service = new DestinationForwardingService(pool);
  
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.method === 'POST' && req.path === '/webhook') {
      const event: WebhookEvent = {
        id: req.headers['x-webhook-id'] as string || Date.now().toString(),
        payload: req.body,
        createdAt: new Date()
      };
      
      service.forwardWebhookToDestinations(event).catch(console.error);
    }
    
    next();
  };
};
