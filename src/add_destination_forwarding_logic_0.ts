import express from 'express';
import { WebClient } from '@slack/web-api';
import { Pool } from 'pg';

interface Destination {
  id: string;
  url: string;
  secret: string;
  active: boolean;
}

interface WebhookEvent {
  id: string;
  payload: any;
  timestamp: Date;
  destinationId?: string;
}

class DestinationForwardingService {
  private pool: Pool;
  private slackClient: WebClient;

  constructor(pool: Pool, slackToken?: string) {
    this.pool = pool;
    this.slackClient = slackToken ? new WebClient(slackToken) : null;
  }

  async forwardWebhookToDestinations(event: WebhookEvent): Promise<void> {
    const client = await this.pool.connect();
    try {
      const destinations = await client.query<Destination>(
        'SELECT id, url, secret, active FROM destinations WHERE active = true'
      );
      
      const forwardPromises = destinations.rows.map(async (dest) => {
        try {
          const response = await fetch(dest.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-ID': event.id,
              'X-Destination-ID': dest.id,
              'X-Signature': this.generateSignature(event.payload, dest.secret)
            },
            body: JSON.stringify(event.payload)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          if (this.slackClient) {
            await this.slackClient.chat.postMessage({
              channel: '#webhook-alerts',
              text: `Successfully forwarded webhook ${event.id} to destination ${dest.id}`
            });
          }
        } catch (error) {
          console.error(`Failed to forward to destination ${dest.id}:`, error);
          if (this.slackClient) {
            await this.slackClient.chat.postMessage({
              channel: '#webhook-alerts',
              text: `Failed to forward webhook ${event.id} to destination ${dest.id}: ${error.message}`
            });
          }
        }
      });
      
      await Promise.all(forwardPromises);
    } finally {
      client.release();
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const data = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}

export default DestinationForwardingService;
