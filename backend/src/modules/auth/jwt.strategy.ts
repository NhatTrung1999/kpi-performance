import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RequestUser } from '../access/access.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Token cũ (trước khi có phân quyền) không có role → coi như không hợp lệ.
  validate(payload: {
    sub: string;
    username: string;
    role?: RequestUser['role'];
    psk?: string | null;
    sid?: string;
  }): RequestUser {
    if (payload.role !== 'AD' && payload.role !== 'CQ') {
      throw new UnauthorizedException();
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      personSerialKey: payload.psk ?? null,
      sid: payload.sid,
    };
  }
}
