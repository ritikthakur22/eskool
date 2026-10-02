import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength } from 'class-validator';

export class CreateHomeworkDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsOptional()
  sectionId?: string;
}

export class SubmitHomeworkDto {
  @IsString()
  @IsNotEmpty()
  homeworkId: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
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
