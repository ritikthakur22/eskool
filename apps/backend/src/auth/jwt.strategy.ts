import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const jwtSecret: string = process.env.JWT_SECRET ?? '';
if (!jwtSecret) {
  throw new Error('JWT_SECRET must be configured before starting the backend');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    if (payload.tokenUse === 'refresh') {
      throw new UnauthorizedException('Refresh tokens cannot be used as access tokens');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, schoolId: true, status: true, tokenVersion: true, school: { select: { status: true } } },
    });
    if (!user) throw new UnauthorizedException('Account is no longer available.');
    if (user.status !== 'ACTIVE' || user.school.status !== 'ACTIVE') throw new UnauthorizedException('This account or school is inactive.');
    if (payload.tokenVersion !== user.tokenVersion) throw new UnauthorizedException('This session is no longer valid. Please sign in again.');
    const { status: _status, tokenVersion: _tokenVersion, school: _school, ...identity } = user;
    return identity;
  }
}
