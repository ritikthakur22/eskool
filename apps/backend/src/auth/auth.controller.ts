import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, Get, UseGuards, Request, Delete } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthRateLimitGuard } from './rate-limit.guard.js';
import { LoginDto, RefreshDto, GoogleLoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshSession(body.refresh_token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body() body: RefreshDto) {
    if (body.refresh_token) return this.authService.logout(body.refresh_token);
    return { success: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  @UseGuards(AuthRateLimitGuard)
  async googleLogin(@Body() body: GoogleLoginDto) {
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
