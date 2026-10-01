import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException, Get, UseGuards, Request, Delete } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthRateLimitGuard } from './rate-limit.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() body: any) {
    if (typeof body?.email !== 'string' || !body.email.trim() || typeof body?.password !== 'string' || !body.password) {
      throw new BadRequestException('Email and password are required.');
    }
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() body: any) {
    if (typeof body.refresh_token !== 'string' || !body.refresh_token) {
      throw new BadRequestException('refresh_token is required');
    }
    return this.authService.refreshSession(body.refresh_token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: any) {
    if (typeof body?.refresh_token === 'string' && body.refresh_token) return this.authService.logout(body.refresh_token);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  @UseGuards(AuthRateLimitGuard)
  async googleLogin(@Body() body: any) {
    if (typeof body?.idToken !== 'string' || !body.idToken) {
      throw new BadRequestException('idToken is required');
    }
    const user = await this.authService.validateGoogleUser(body.idToken);
    return this.authService.login(user);
  }

  @Get('google/status')
  @UseGuards(JwtAuthGuard)
  getGoogleLinkStatus(@Request() req: any) {
    return this.authService.getGoogleLinkStatus(req.user.id);
  }

  @Post('google/link')
  @UseGuards(JwtAuthGuard)
  async linkGoogleAccount(@Body() body: any, @Request() req: any) {
    if (typeof body?.idToken !== 'string' || !body.idToken) throw new BadRequestException('idToken is required');
    return this.authService.linkGoogleAccount(req.user.id, body.idToken);
  }

  @Delete('google/link')
  @UseGuards(JwtAuthGuard)
  unlinkGoogleAccount(@Request() req: any) {
    return this.authService.unlinkGoogleAccount(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req: any) {
    return req.user;
  }
}
