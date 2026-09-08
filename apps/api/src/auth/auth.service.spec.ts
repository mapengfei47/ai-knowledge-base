import { UnauthorizedException } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = { id: '9f352cd3-0f09-492b-aeab-9dfc69a66a13', username: 'admin', displayName: '平台管理员', passwordHash: 'hash' } as User;
  let users: jest.Mocked<Pick<UsersService, 'findByUsername' | 'verifyPassword'>>;
  let cache: jest.Mocked<Pick<CacheService, 'get' | 'set' | 'del' | 'increment'>>;
  let service: AuthService;

  beforeEach(() => {
    users = { findByUsername: jest.fn(), verifyPassword: jest.fn() };
    cache = { get: jest.fn(), set: jest.fn(), del: jest.fn(), increment: jest.fn() };
    service = new AuthService(users as unknown as UsersService, cache as unknown as CacheService);
    cache.get.mockResolvedValue(null);
  });

  it('creates a remembered session for valid credentials', async () => {
    users.findByUsername.mockResolvedValue(user);
    users.verifyPassword.mockResolvedValue(true);

    const result = await service.login({ username: 'admin', password: 'secret', remember: true }, '127.0.0.1');

    expect(result.user).toEqual({ id: user.id, username: 'admin', displayName: '平台管理员' });
    expect(result.ttl).toBe(60 * 60 * 24 * 7);
    expect(cache.set).toHaveBeenCalledWith(expect.stringMatching(/^auth:session:/), result.user, result.ttl);
  });

  it('records a failed attempt without revealing whether the user exists', async () => {
    users.findByUsername.mockResolvedValue(null);
    cache.increment.mockResolvedValue(1);

    await expect(service.login({ username: 'unknown', password: 'wrong' }, '127.0.0.1')).rejects.toThrow('账号或密码错误');
    expect(cache.increment).toHaveBeenCalledWith('auth:attempts:127.0.0.1:unknown', 15 * 60);
  });

  it('rejects a temporarily rate-limited login', async () => {
    cache.get.mockResolvedValue(5);

    await expect(service.login({ username: 'admin', password: 'secret' }, '127.0.0.1')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(users.findByUsername).not.toHaveBeenCalled();
  });
});
