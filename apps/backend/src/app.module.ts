import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { ContextMiddleware } from './context/context.middleware.js';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, StorageModule, AuditModule, UsersModule, AuthModule, AttendanceModule, NoticesModule, HomeworkModule, ExamsModule, RoutineModule, FeesModule, AcademicsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes('*');
  }
}
