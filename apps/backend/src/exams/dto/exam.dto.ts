import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, Min, IsUUID, MaxLength, IsArray } from 'class-validator';

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

export class UpdateExamDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @IsOptional() @IsDateString() date?: string;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  @Min(0)
  correctOptionIndex: number;

  @IsNumber()
  @Min(1)
  marks: number;
}

export class UpdateQuestionDto {
  @IsOptional() @IsString() @IsNotEmpty() text?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @IsOptional() @IsNumber() @Min(0) correctOptionIndex?: number;
  @IsOptional() @IsNumber() @Min(1) marks?: number;
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @IsNumber()
  @Min(0)
  selectedOptionIndex: number;
}
