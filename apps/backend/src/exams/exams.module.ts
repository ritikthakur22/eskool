import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { ExamsController } from './exams.controller.js';

@Module({
  providers: [ExamsService],
  controllers: [ExamsController]
})
export class ExamsModule {}
