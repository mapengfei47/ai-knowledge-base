import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../cache/cache.service';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DataSource, private readonly cache: CacheService) {}

  @Get()
  async check() {
    await Promise.all([this.database.query('SELECT 1'), this.cache.ping()]);
    return {
      status: 'ok',
      services: { api: 'up', postgres: 'up', redis: 'up' },
      timestamp: new Date().toISOString(),
    };
  }
}

