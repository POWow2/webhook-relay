import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';

interface WebhookDestination {
  id: string;
  url: string;
  secret: string;
}

interface WebhookEvent {
  id: string;
  payload: any;
  timestamp: Date;
  destinations: WebhookDestination[];
}

class WebhookForwardingService {
  private pool: Pool;
  private app: express.Application;

  constructor(pool: Pool, app: express.Application) {
    this.pool = pool;
    this.app = app;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.post('/webhook/:id', async (req, res) => {
      try {
        const webhookId = req.params.id;
        const payload = req.body;
        
        const destinations = await this.getDestinationsForWebhook(webhookId);
        await this.forwardToDestinations(webhookId, payload, destinations);
        
        res.status(200).send('Webhook forwarded');
      } catch (error) {
        res.status(500).send('Error processing webhook');
      }
    });
  }

  private async getDestinationsForWebhook(webhookId: string): Promise<WebhookDestination[]> {
    const query = `
      SELECT id, url, secret 
      FROM webhook_destinations 
      WHERE webhook_id = $1
    `;
    const result = await this.pool.query(query, [webhookId]);
    return result.rows;
  }

  private async forwardToDestinations(
    webhookId: string, 
    payload: any, 
    destinations: WebhookDestination[]
  ): Promise<void> {
    const forwardPromises = destinations.map(async (dest) => {
      try {
        await axios.post(dest.url, payload, {
          headers: {
            'X-Webhook-Secret': dest.secret,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error(`Failed to forward to ${dest.url}:`, error);
      }
    });

    await Promise.all(forwardPromises);
  }
}

export default WebhookForwardingService;
