import { Body, Controller, Delete, Post, Request, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { NotificationsService } from './notifications.service.js';

class DeviceTokenDto {
  @IsString() @MaxLength(200) token!: string;
  @IsOptional() @IsIn(['android', 'ios', 'web']) platform?: string;
}

@Controller('notifications/push-token')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  register(@Body() body: DeviceTokenDto, @Request() req: any) {
    return this.notifications.registerDevice(req.user.id, body.token, body.platform);
  }

  @Delete()
  remove(@Body() body: DeviceTokenDto, @Request() req: any) {
    return this.notifications.removeDevice(req.user.id, body.token);
  }
}
