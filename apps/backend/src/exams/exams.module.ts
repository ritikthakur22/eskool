import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { ExamsController } from './exams.controller.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [StorageModule],
  providers: [ExamsService],
  controllers: [ExamsController]
})
export class ExamsModule {}
