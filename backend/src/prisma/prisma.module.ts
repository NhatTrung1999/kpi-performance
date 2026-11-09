import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { PrismaAuthService } from './prisma-auth.service.js';
import { PrismaHrisService } from './prisma-hris.service.js';

@Module({
  providers: [PrismaService, PrismaAuthService, PrismaHrisService],
  exports: [PrismaService, PrismaAuthService, PrismaHrisService],
})
export class PrismaModule {}
