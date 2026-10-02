import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength, IsUUID, IsUrl } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;
}

export class SubmitHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  homeworkId: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsOptional()
  fileUrl?: string;
}

export class GradeHomeworkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  grade: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  feedback?: string;
}
