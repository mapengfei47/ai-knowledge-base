import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'JWT access token and administrator profile' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }
}

