import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, token: string, platform?: string) {
    const normalized = token.trim();
    if (!/^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(normalized)) throw new BadRequestException('A valid Expo push token is required.');
    return this.prisma.pushDeviceToken.upsert({
      where: { token: normalized },
      create: { userId, token: normalized, platform: platform?.slice(0, 30) || null },
      update: { userId, platform: platform?.slice(0, 30) || null },
      select: { id: true },
    });
  }

  async removeDevice(userId: string, token: string) {
    await this.prisma.pushDeviceToken.deleteMany({ where: { userId, token: token.trim() } });
    return { success: true };
  }

  async sendHomeworkPosted(target: { sectionId?: string; classId?: string }, schoolId: string, homework: { id: string; title: string; dueDate: Date; subject?: { name: string } | null }, teacherName: string) {
    try {
      const section = target.sectionId ? await this.prisma.section.findFirst({ where: { id: target.sectionId, schoolId }, select: { id: true, name: true, class: { select: { name: true } } } }) : null;
      const classRecord = target.classId ? await this.prisma.class.findFirst({ where: { id: target.classId, schoolId }, select: { id: true, name: true } }) : null;
      if (!section && !classRecord) return;
      const enrollments = await this.prisma.enrollment.findMany({ where: { ...(section ? { sectionId: section.id } : { section: { classId: classRecord!.id } }), student: { schoolId, role: 'STUDENT', status: 'ACTIVE' } }, select: { studentId: true } });
      const profileStudents = classRecord ? await this.prisma.user.findMany({ where: { schoolId, role: 'STUDENT', status: 'ACTIVE', studentProfile: { grade: { in: [classRecord.name, `Class ${classRecord.name}`], mode: 'insensitive' } } }, select: { id: true } }) : [];
      const studentIds = [...new Set([...enrollments.map(item => item.studentId), ...profileStudents.map(item => item.id)])];
      if (!studentIds.length) return;
      const parents = await this.prisma.parentStudent.findMany({ where: { studentId: { in: studentIds }, parent: { schoolId, status: 'ACTIVE' } }, select: { parentId: true } });
      const recipientIds = [...new Set([...studentIds, ...parents.map(item => item.parentId)])];
      const devices: Array<{ token: string }> = await this.prisma.pushDeviceToken.findMany({ where: { userId: { in: recipientIds } }, select: { token: true } });
      if (!devices.length) return;
      const dueLabel = homework.dueDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
      const targetLabel = section ? `${section.class.name} · ${section.name}` : classRecord!.name;
      const payloads = devices.map(device => ({ to: device.token, title: 'New homework assigned', body: `${targetLabel}: ${homework.title} · Due ${dueLabel}`, sound: 'default', priority: 'high', channelId: 'homework', data: { type: 'HOMEWORK_ASSIGNED', homeworkId: homework.id, sectionId: target.sectionId || null, classId: target.classId || null, schoolId, teacherName, subject: homework.subject?.name || null } }));
      for (let index = 0; index < payloads.length; index += 100) {
        const response = await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' }, body: JSON.stringify(payloads.slice(index, index + 100)) });
        if (!response.ok) continue;
        const result = await response.json() as { data?: Array<{ status?: string; details?: { error?: string }; id?: string }> };
        const invalidTokens = (result.data || []).flatMap((receipt, offset) => receipt.details?.error === 'DeviceNotRegistered' ? [payloads[index + offset]?.to] : []).filter((token): token is string => Boolean(token));
        if (invalidTokens.length) await this.prisma.pushDeviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
      }
    } catch (error) {
      // Push delivery is best-effort; homework creation must succeed independently.
      console.error('homework_push_delivery_failed', error);
    }
  }
}
