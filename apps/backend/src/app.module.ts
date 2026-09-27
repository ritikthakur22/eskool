import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { NoticesModule } from './notices/notices.module.js';
import { HomeworkModule } from './homework/homework.module.js';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, AttendanceModule, NoticesModule, HomeworkModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
