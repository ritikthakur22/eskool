import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly enabled = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  constructor() {
    if (this.enabled) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  }

  isConfigured() {
    return this.enabled;
  }

  async upload(buffer: Buffer, options: { folder: string; resourceType?: 'image' | 'raw' | 'auto' }): Promise<Pick<UploadApiResponse, 'secure_url' | 'public_id' | 'resource_type' | 'bytes'>> {
    if (!this.enabled) throw new ServiceUnavailableException('Cloudinary storage is not configured.');
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: options.folder, resource_type: options.resourceType || 'auto' }, (error, result) => {
        if (error || !result) return reject(new ServiceUnavailableException('Media storage upload failed.'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id, resource_type: result.resource_type, bytes: result.bytes });
      });
      stream.end(buffer);
    });
  }
}
