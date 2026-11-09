import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { LocalStrategy } from './local.strategy.js';
import { JwtStrategy } from './jwt.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { SessionsService } from './sessions.service.js';
import { LoginAttemptsService } from './login-attempts.service.js';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AccessModule } from '../access/access.module.js';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    AccessModule,
    PassportModule,
    // Rate limit theo IP cho /api/auth/* (lưu trong bộ nhớ). Login giới hạn chặt hơn ở controller.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 30 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Access token ngắn hạn; phiên dài hạn do refresh token (auth_sessions) giữ.
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    SessionsService,
    LoginAttemptsService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
