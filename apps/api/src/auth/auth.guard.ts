import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RedisService } from '../infrastructure/redis/redis.service';
import type { AuthenticatedUser, JwtPayload } from './auth.types';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      // JWT validity and server-side session validity are both required.
      const sessionUserId = await this.redis.get(`session:${payload.sid}`);
      if (sessionUserId !== payload.sub) {
        throw new UnauthorizedException('Session expired');
      }
      request.user = {
        id: payload.sub,
        email: payload.email,
        name: '',
        sessionId: payload.sid,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

