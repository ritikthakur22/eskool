import { Test, TestingModule } from '@nestjs/testing';
import { NoticesController } from './notices.controller.js';
import { NoticesService } from './notices.service.js';

describe('NoticesController', () => {
  let controller: NoticesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticesController],
      providers: [{ provide: NoticesService, useValue: {} }],
    }).compile();

    controller = module.get<NoticesController>(NoticesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
