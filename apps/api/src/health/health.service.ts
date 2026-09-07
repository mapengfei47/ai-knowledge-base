import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  service: 'api';
  timestamp: string;
  dependencies: {
    postgres: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthResponse> {
    // Run independent probes together so one slow dependency does not delay the other.
    const [postgres, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);
    const dependencies = {
      postgres: postgres.status === 'fulfilled' ? ('up' as const) : ('down' as const),
      redis: redis.status === 'fulfilled' ? ('up' as const) : ('down' as const),
    };

    return {
      status: dependencies.postgres === 'up' && dependencies.redis === 'up' ? 'ok' : 'degraded',
      service: 'api',
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }
}

