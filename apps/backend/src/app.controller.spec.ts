import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let appController: AppController;
  const queryRaw = vi.fn();

  beforeEach(async () => {
    queryRaw.mockReset();
    queryRaw.mockResolvedValue([{ userReady: true, sessionsReady: true, auditReady: true }]);
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: { $queryRaw: queryRaw } }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  it('reports backend and database readiness', async () => {
    await expect(appController.getHealth()).resolves.toEqual({ status: 'ok', database: 'ok' });
  });

  it('reports schema readiness separately from liveness', async () => {
    queryRaw.mockResolvedValueOnce([{ userReady: true, sessionsReady: true, auditReady: true }]);
    await expect(appController.getReadiness()).resolves.toEqual({ status: 'ok', database: 'ok', schema: 'ok' });
  });

  it('returns service unavailable when the schema readiness check fails', async () => {
    queryRaw.mockResolvedValueOnce([{ userReady: false, sessionsReady: true, auditReady: true }]);
    await expect(appController.getReadiness()).rejects.toMatchObject({ status: 503 });
  });
});
