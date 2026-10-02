import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateConversationDto } from './dto/create-conversation.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(schoolId: string, userId: string, dto: CreateConversationDto) {
    // Basic permissions: check if users belong to the school
    const participants = await this.prisma.user.findMany({
      where: {
        id: { in: [...dto.participantIds, userId] },
        schoolId,
      },
    });

    if (participants.length !== new Set([...dto.participantIds, userId]).size) {
      throw new ForbiddenException('Some participants do not belong to this school');
    }

    const type = dto.participantIds.length > 1 ? 'GROUP' : 'INDIVIDUAL';

    return this.prisma.conversation.create({
      data: {
        schoolId,
        name: dto.name,
        type,
        participants: {
          create: [...new Set([...dto.participantIds, userId])].map(id => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async sendMessage(schoolId: string, userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.schoolId !== schoolId) {
      throw new ForbiddenException('Conversation does not belong to your school');
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // Basic moderation limit (e.g. text length)
    if (dto.content.length > 1000) {
      throw new BadRequestException('Message is too long. Limit is 1000 characters.');
    }

    // Check rate limit: user sent more than 10 messages in the last minute?
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentMessages = await this.prisma.message.count({
      where: {
        senderId: userId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentMessages > 10) {
      throw new ForbiddenException('You are sending messages too fast. Please slow down.');
    }

    // Add moderation for forbidden words (basic)
    const forbiddenWords = ['spam', 'abuse', 'hate']; // Simplified example
    const lowerContent = dto.content.toLowerCase();
    const isFlagged = forbiddenWords.some(word => lowerContent.includes(word));

    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
        isFlagged,
      },
    });
  }

  async getConversations(schoolId: string, userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        schoolId,
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, adminProfile: true, studentProfile: true, teacherProfile: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(schoolId: string, userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    
    if (conversation.schoolId !== schoolId) {
      throw new ForbiddenException('Conversation does not belong to your school');
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
