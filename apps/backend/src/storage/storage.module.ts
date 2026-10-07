import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service.js';
import { StorageController } from './storage.controller.js';

@Global()
@Module({
  controllers: [StorageController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class StorageModule {}
