import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CloudinaryService } from './cloudinary.service.js';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Choose a file to upload.');
    // Determine type for Cloudinary
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'auto';
    const result = await this.cloudinaryService.upload(file.buffer, { folder: 'general', resourceType });
    
    return {
      url: result.secure_url,
      mimeType: file.mimetype,
      publicId: result.public_id,
      bytes: result.bytes,
    };
  }
}
