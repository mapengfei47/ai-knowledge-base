import { Body, Controller, Get, HttpCode, Ip, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthenticatedRequest } from './auth.guard';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() input: LoginDto, @Ip() ip: string, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input, ip);
    response.setHeader('Set-Cookie', this.cookie(result.token, input.remember ? result.ttl : undefined));
    return { user: result.user };
  }

  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return { user: request.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.sessionToken);
    response.setHeader('Set-Cookie', this.cookie('', 0));
    return { success: true };
  }

  private cookie(value: string, maxAge?: number) {
    const secure = this.config.get('COOKIE_SECURE', 'false') === 'true';
    const parts = [`${AuthService.cookieName}=${value}`, 'HttpOnly', 'Path=/', 'SameSite=Strict'];
    if (secure) parts.push('Secure');
    if (maxAge !== undefined) parts.push(`Max-Age=${maxAge}`);
    return parts.join('; ');
  }
}
