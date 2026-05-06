import express from 'express';
import axios from 'axios';
import { Pool } from 'pg';

interface WebhookEvent {
  id: string;
  payload: any;
  timestamp: Date;
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
            timestamp: event.timestamp
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': this.generateSignature(dest.secret, event.payload)
            },
            timeout: 5000
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
    // Simple HMAC signature generation for demonstration
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}

export const setupDestinationForwarding = (app: express.Application, pool: Pool) => {
  const service = new DestinationForwardingService(pool);
  
  app.post('/webhook', async (req, res) => {
    try {
      const event: WebhookEvent = {
        id: Date.now().toString(),
        payload: req.body,
        timestamp: new Date()
      };
      
      await service.forwardWebhookToDestinations(event);
      res.status(200).send('Webhook processed');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  });
};
