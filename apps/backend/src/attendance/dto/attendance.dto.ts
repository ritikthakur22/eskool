import { ArrayMinSize, IsArray, IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
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

export class BulkAttendanceEntryDto {
  @IsUUID()
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remarks?: string;
}

export class BulkMarkAttendanceDto {
  @IsUUID()
  sectionId!: string;

  @IsDateString()
  date!: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceEntryDto)
  records!: BulkAttendanceEntryDto[];
}
