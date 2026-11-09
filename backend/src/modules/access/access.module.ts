import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AccessService } from './access.service.js';

@Module({
  imports: [PrismaModule],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
