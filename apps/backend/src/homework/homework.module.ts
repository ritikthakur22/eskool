import { Module } from '@nestjs/common';
import { HomeworkService } from './homework.service.js';
import { HomeworkController } from './homework.controller.js';
import { StorageModule } from '../storage/storage.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [StorageModule, NotificationsModule],
  providers: [HomeworkService],
  controllers: [HomeworkController]
})
export class HomeworkModule {}
