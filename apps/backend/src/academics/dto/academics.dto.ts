import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAcademicYearDto {
  @IsString() @IsNotEmpty() @MaxLength(50) name!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
}

export class CreateClassDto {
  @IsString() @IsNotEmpty() @MaxLength(50) name!: string;
}

export class CreateSectionDto {
  @IsUUID() classId!: string;
  @IsString() @IsNotEmpty() @MaxLength(50) name!: string;
}

export class CreateSubjectDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(30) code?: string;
}

export class CreateEnrollmentDto {
  @IsUUID() studentId!: string;
  @IsUUID() sectionId!: string;
  @IsUUID() academicYearId!: string;
  @IsOptional() @IsString() @MaxLength(50) rollNo?: string;
}

export class CreateTeacherAssignmentDto {
  @IsUUID() teacherId!: string;
  @IsUUID() sectionId!: string;
  @IsUUID() subjectId!: string;
  @IsUUID() academicYearId!: string;
}

export class CreateParentLinkDto {
  @IsUUID() parentId!: string;
  @IsUUID() studentId!: string;
}
