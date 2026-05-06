import { Request, Response } from 'express';
import axios from 'axios';
import { getDestinationsForWebhook } from './db';

export const forwardWebhookToDestinations = async (req: Request, res: Response) => {
  const { payload, webhookId } = req.body;

  if (!payload || !webhookId) {
    return res.status(400).json({ error: 'Missing payload or webhookId' });
  }

  try {
    const destinations = await getDestinationsForWebhook(webhookId);
    const promises = destinations.map(dest =>
      axios.post(dest.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...JSON.parse(dest.headers || '{}'),
        },
        timeout: 5000,
      })
    );

    const results = await Promise.allSettled(promises);
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Forwarded webhook ${webhookId}: ${succeeded} succeeded, ${failed} failed`);
    res.status(202).json({ message: 'Webhook forwarded to destinations', succeeded, failed });
  } catch (err) {
    console.error('Error forwarding webhook:', err);
    res.status(500).json({ error: 'Failed to forward webhook' });
  }
};
