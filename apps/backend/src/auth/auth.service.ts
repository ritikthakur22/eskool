import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client('228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateGoogleUser(idToken: string): Promise<any> {
    try {
      const ticket = await client.verifyIdToken({
          idToken: idToken,
          audience: '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com',
      });
      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        throw new BadRequestException('Google token did not contain an email');
      }

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException('This Google account is not registered. Please contact the administrator.');
      }
      
      const { password, ...result } = user;
      return result;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: payload
    };
  }

}
