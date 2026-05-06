import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';

export class DestinationForwardingService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async forwardWebhook(webhookId: string, payload: any): Promise<void> {
    const client = await this.pool.connect();
    try {
      const destinations = await client.query(
        'SELECT url, headers FROM destinations WHERE webhook_id = $1',
        [webhookId]
      );

      for (const destination of destinations.rows) {
        try {
          const headers = destination.headers ? JSON.parse(destination.headers) : {};
          await axios.post(destination.url, payload, { headers });
        } catch (error) {
          console.error(`Failed to forward to destination ${destination.url}:`, error);
        }
      }
    } finally {
      client.release();
    }
  }
}

export const addDestinationForwardingLogic = (app: express.Application, pool: Pool) => {
  const forwardingService = new DestinationForwardingService(pool);

  app.post('/webhooks/:webhookId/forward', async (req, res) => {
    try {
      await forwardingService.forwardWebhook(req.params.webhookId, req.body);
      res.status(200).send('Webhook forwarded successfully');
    } catch (error) {
      res.status(500).send('Failed to forward webhook');
    }
  });
};
