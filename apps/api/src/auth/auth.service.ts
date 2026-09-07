import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import type { AuthenticatedUser, JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      // Keep the response identical for an unknown account and a wrong password.
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = randomUUID();
    const payload: JwtPayload = { sub: user.id, sid: sessionId, email: user.email };
    await this.redis.setWithTtl(`session:${sessionId}`, user.id, this.expiresInSeconds);
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: this.expiresInSeconds });

    await this.prisma.operationLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_LOGIN',
        resourceType: 'USER',
        resourceId: user.id,
      },
    });

    return {
      accessToken,
      expiresIn: this.expiresInSeconds,
      user: this.toPublicUser(user),
    };
  }

  async logout(user: AuthenticatedUser) {
    await this.redis.delete(`session:${user.sessionId}`);
    await this.prisma.operationLog.create({
      data: {
        actorId: user.id,
        action: 'AUTH_LOGOUT',
        resourceType: 'USER',
        resourceId: user.id,
      },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toPublicUser(user);
  }

  private toPublicUser(user: { id: string; email: string; name: string }) {
    return { id: user.id, email: user.email, name: user.name };
  }
}

