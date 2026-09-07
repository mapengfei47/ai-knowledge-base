import { randomUUID } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaService } from './prisma.service';
import { redisConnectionFromUrl } from './redis-connection';

const INGESTION_QUEUE = 'document-ingestion';
const LOCK_TTL_MS = 5 * 60 * 1000;

interface IngestionJobData {
  documentId: string;
  ingestionJobId: string;
}

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private worker?: Worker<IngestionJobData>;
  private lockRedis?: Redis;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error('REDIS_URL is required');

    this.lockRedis = new Redis(redisUrl, { maxRetriesPerRequest: null });
    this.worker = new Worker<IngestionJobData>(
      INGESTION_QUEUE,
      (job) => this.process(job),
      {
        connection: redisConnectionFromUrl(redisUrl),
        concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
      },
    );

    this.worker.on('ready', () => this.logger.log(`Listening on queue: ${INGESTION_QUEUE}`));
    this.worker.on('completed', (job) => this.logger.log(`Document job ${job.id ?? 'unknown'} completed`));
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Document job ${job?.id ?? 'unknown'} failed`, error.stack);
    });
    this.worker.on('error', (error) => this.logger.error(error.message, error.stack));
  }

  private async process(job: Job<IngestionJobData>) {
    const { documentId, ingestionJobId } = job.data;
    const lockKey = `document-lock:${documentId}`;
    const lockToken = randomUUID();
    const locked = await this.lockRedis?.set(lockKey, lockToken, 'PX', LOCK_TTL_MS, 'NX');
    if (locked !== 'OK') throw new Error('Document is already being processed');

    try {
      await job.updateProgress(10);
      await this.prisma.$transaction([
        this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'PROCESSING', errorMessage: null },
        }),
        this.prisma.ingestionJob.update({
          where: { id: ingestionJobId },
          data: {
            status: 'PROCESSING',
            progress: 10,
            attempt: job.attemptsMade + 1,
            errorMessage: null,
            startedAt: new Date(),
          },
        }),
      ]);

      const document = await this.prisma.document.findUniqueOrThrow({ where: { id: documentId } });
      const file = await stat(document.storagePath);
      if (!file.isFile() || file.size === 0) throw new Error('Stored document is missing or empty');

      await job.updateProgress(70);
      await this.prisma.ingestionJob.update({ where: { id: ingestionJobId }, data: { progress: 70 } });

      // M3 stops after storage verification; M4 replaces this point with parse/chunk/embed steps.
      await this.prisma.$transaction([
        this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'COMPLETED', errorMessage: null },
        }),
        this.prisma.ingestionJob.update({
          where: { id: ingestionJobId },
          data: { status: 'COMPLETED', progress: 100, errorMessage: null, finishedAt: new Date() },
        }),
      ]);
      await job.updateProgress(100);
      return { documentId, readyForParsing: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown ingestion error';
      const finalAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await this.prisma.$transaction([
        this.prisma.document.update({
          where: { id: documentId },
          data: { status: finalAttempt ? 'FAILED' : 'PENDING', errorMessage: message },
        }),
        this.prisma.ingestionJob.update({
          where: { id: ingestionJobId },
          data: {
            status: finalAttempt ? 'FAILED' : 'WAITING',
            progress: 0,
            attempt: job.attemptsMade + 1,
            errorMessage: message,
            finishedAt: finalAttempt ? new Date() : null,
          },
        }),
      ]);
      throw error;
    } finally {
      // Compare-and-delete avoids removing a newer lock after this lock has expired.
      await this.lockRedis?.eval(
        'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
        1,
        lockKey,
        lockToken,
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
    this.lockRedis?.disconnect();
  }
}

