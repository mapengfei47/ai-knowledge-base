import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SessionUser } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';

export type AuthenticatedRequest = Request & { user: SessionUser; sessionToken: string };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readCookie(request.headers.cookie, AuthService.cookieName);
    if (!token) throw new UnauthorizedException('请先登录');
    const user = await this.auth.getSession(token);
    if (!user) throw new UnauthorizedException('登录已过期，请重新登录');
    request.user = user;
    request.sessionToken = token;
    return true;
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    return header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  }
}
