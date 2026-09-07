import { describe, expect, it, vi } from 'vitest';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('reports ok when both dependencies respond', async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) };
    const redis = { ping: vi.fn().mockResolvedValue('PONG') };
    const service = new HealthService(prisma as never, redis as never);

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      dependencies: { postgres: 'up', redis: 'up' },
    });
  });
});

