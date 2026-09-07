import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

export const INGESTION_QUEUE = 'document-ingestion';
export const INGESTION_JOB_NAME = 'prepare-document';

function connectionFromUrl(redisUrl: string) {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

@Injectable()
export class IngestionQueueService implements OnModuleDestroy {
  private readonly queue: Queue;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL is required');
    this.queue = new Queue(INGESTION_QUEUE, { connection: connectionFromUrl(redisUrl) });
  }

  async enqueue(queueJobId: string, documentId: string, ingestionJobId: string) {
    return this.queue.add(
      INGESTION_JOB_NAME,
      { documentId, ingestionJobId },
      {
        jobId: queueJobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}

