import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AccessModule } from '../access/access.module.js';
import { DepartmentsController } from './departments.controller.js';
import { DepartmentsService } from './departments.service.js';
import { EmployeesService } from './employees.service.js';

@Module({
  imports: [PrismaModule, AccessModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, EmployeesService],
  exports: [DepartmentsService, EmployeesService],
})
export class DepartmentsModule {}
