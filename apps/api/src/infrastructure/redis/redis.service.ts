import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL is required');
    }

    // Lazy connection lets the API start and report Redis as down instead of crashing at boot.
    this.client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 1_500,
      maxRetriesPerRequest: 0,
      enableOfflineQueue: false,
    });
    this.client.on('error', () => undefined);
  }

  async ping() {
    await this.ensureConnected();
    return this.client.ping();
  }

  async get(key: string) {
    await this.ensureConnected();
    return this.client.get(key);
  }

  async setWithTtl(key: string, value: string, ttlSeconds: number) {
    await this.ensureConnected();
    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  async delete(key: string) {
    await this.ensureConnected();
    return this.client.del(key);
  }

  private async ensureConnected() {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
