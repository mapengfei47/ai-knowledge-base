import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    process.env.JWT_EXPIRES_IN_SECONDS = '3600';
  });

  it('creates a Redis-backed session for valid credentials', async () => {
    const user = {
      id: '8ef4744f-b96c-4d1b-a499-4bc3ef89dc75',
      email: 'admin@example.com',
      name: 'Demo Admin',
      passwordHash: await hash('admin123456', 4),
    };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(user) },
      operationLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const redis = { setWithTtl: vi.fn().mockResolvedValue('OK') };
    const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
    const service = new AuthService(prisma as never, redis as never, jwt as never);

    const result = await service.login({ email: user.email, password: 'admin123456' });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(redis.setWithTtl).toHaveBeenCalledOnce();
  });
});

