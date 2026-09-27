import { Module } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { NoticesController } from './notices.controller.js';

@Module({
  providers: [NoticesService],
  controllers: [NoticesController]
})
export class NoticesModule {}
