import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { CacheService } from '../cache/cache.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './auth.dto';
import { SessionUser } from './auth.types';

@Injectable()
export class AuthService {
  static readonly cookieName = 'knowledge_session';
  private readonly regularTtl = 60 * 60 * 8;
  private readonly rememberedTtl = 60 * 60 * 24 * 7;

  constructor(
    private readonly users: UsersService,
    private readonly cache: CacheService,
  ) {}

  async login(input: LoginDto, ip: string): Promise<{ token: string; user: SessionUser; ttl: number }> {
    const attemptKey = `auth:attempts:${ip}:${input.username.trim().toLowerCase()}`;
    const attempts = (await this.cache.get<number>(attemptKey)) ?? 0;
    if (attempts >= 5) throw new UnauthorizedException('登录尝试过多，请稍后再试');

    const user = await this.users.findByUsername(input.username);
    const valid = user ? await this.users.verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !valid) {
      await this.cache.increment(attemptKey, 15 * 60);
      throw new UnauthorizedException('账号或密码错误');
    }

    await this.cache.del(attemptKey);
    const token = randomBytes(32).toString('base64url');
    const ttl = input.remember ? this.rememberedTtl : this.regularTtl;
    const sessionUser = { id: user.id, username: user.username, displayName: user.displayName };
    await this.cache.set(this.sessionKey(token), sessionUser, ttl);
    return { token, user: sessionUser, ttl };
  }

  getSession(token: string) {
    return this.cache.get<SessionUser>(this.sessionKey(token));
  }

  async logout(token?: string) {
    if (token) await this.cache.del(this.sessionKey(token));
  }

  private sessionKey(token: string) {
    return `auth:session:${token}`;
  }
}
