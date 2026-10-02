import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  sectionId: string;
}

export class AddExamResultDto {
  @IsString()
  @IsNotEmpty()
  examId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0)
  marksObtained: number;

  @IsNumber()
  @Min(1)
  totalMarks: number;

  @IsString()
  @IsOptional()
  grade?: string;
}
