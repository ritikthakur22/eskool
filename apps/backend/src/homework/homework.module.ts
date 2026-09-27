import { Module } from '@nestjs/common';
import { HomeworkService } from './homework.service.js';
import { HomeworkController } from './homework.controller.js';

@Module({
  providers: [HomeworkService],
  controllers: [HomeworkController]
})
export class HomeworkModule {}
