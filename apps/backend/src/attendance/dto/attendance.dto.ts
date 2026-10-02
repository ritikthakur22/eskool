import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class MarkAttendanceDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  subject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remarks?: string;
}

export class CorrectAttendanceDto {
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remarks?: string;
}
