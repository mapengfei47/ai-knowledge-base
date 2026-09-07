import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: RedisClientType;
  private readonly ttl: number;

  constructor(config: ConfigService) {
    this.client = createClient({ url: config.getOrThrow<string>('REDIS_URL') });
    this.client.on('error', (error) => this.logger.error(error));
    this.ttl = Number(config.get('CACHE_TTL_SECONDS', 60));
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onApplicationShutdown() {
    if (this.client.isOpen) await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.client.set(key, JSON.stringify(value), { EX: this.ttl });
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.client.del(keys);
  }

  ping(): Promise<string> {
    return this.client.ping();
  }
}

