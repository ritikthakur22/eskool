import { Module } from '@nestjs/common';
import { ClassRoutineController, RoutineController } from './routine.controller.js';
import { RoutineService } from './routine.service.js';

@Module({ controllers: [RoutineController, ClassRoutineController], providers: [RoutineService] })
export class RoutineModule {}
