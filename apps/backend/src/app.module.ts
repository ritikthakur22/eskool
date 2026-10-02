import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { NoticesModule } from './notices/notices.module.js';
import { HomeworkModule } from './homework/homework.module.js';
import { ExamsModule } from './exams/exams.module.js';
import { RoutineModule } from './routine/routine.module.js';
import { FeesModule } from './fees/fees.module.js';
import { StorageModule } from './storage/storage.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AcademicsModule } from './academics/academics.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ChatModule } from './chat/chat.module.js';

@Module({
  imports: [PrismaModule, StorageModule, AuditModule, UsersModule, AuthModule, AttendanceModule, NoticesModule, HomeworkModule, ExamsModule, RoutineModule, FeesModule, AcademicsModule, DashboardModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
