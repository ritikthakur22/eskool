import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, Min, IsUUID, MaxLength } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sectionId: string;
}

export class AddExamResultDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  examId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsNumber()
  @Min(1)
  totalMarks: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  grade?: string;
}
