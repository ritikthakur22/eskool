import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

describe('AuthService', () => {
  let service: AuthService;
  const prismaMock = { user: { findUnique: vi.fn() }, $executeRaw: vi.fn() };
  const jwtMock = { sign: vi.fn(() => 'access-token') };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: {} }, { provide: JwtService, useValue: jwtMock }, { provide: PrismaService, useValue: prismaMock }, { provide: AuditService, useValue: { record: async () => undefined } }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns no user for invalid credentials without exposing account details', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    await expect(service.validateUser('invalid@example.com', 'wrong-password')).resolves.toBeNull();
  });

  it('converts database lookup failures into a controlled service-unavailable error', async () => {
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('schema drift'));
    await expect(service.validateUser('user@example.com', 'password')).rejects.toMatchObject({ response: { message: 'Authentication service is temporarily unavailable. Please try again later.' } });
  });

  it('does not expose the internal auth session id in login responses', async () => {
    prismaMock.$executeRaw.mockResolvedValueOnce(1);
    const response = await service.login({ id: 'user-id', email: 'user@example.com', role: 'STUDENT', schoolId: 'school-id', tokenVersion: 0 });
    expect(response).toMatchObject({ access_token: 'access-token', user: { sub: 'user-id' } });
    expect(response).not.toHaveProperty('sessionId');
  });
});
