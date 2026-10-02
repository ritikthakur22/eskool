import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createConversation(@Request() req: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.schoolId, req.user.id, dto);
  }

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.chatService.getConversations(req.user.schoolId, req.user.id);
  }

  @Post('conversations/:id/messages')
  sendMessage(@Request() req: any, @Param('id') conversationId: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.schoolId, req.user.id, conversationId, dto);
  }

  @Get('conversations/:id/messages')
  getMessages(@Request() req: any, @Param('id') conversationId: string) {
    return this.chatService.getMessages(req.user.schoolId, req.user.id, conversationId);
  }
}
