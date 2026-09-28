import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('google')
  async googleLogin(@Body() body: any) {
    if (!body.idToken) {
      throw new BadRequestException('idToken is required');
    }
    const user = await this.authService.validateGoogleUser(body.idToken);
    return this.authService.login(user);
  }
}
