import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, Min, Max, IsInt, IsUUID, MaxLength, IsArray, IsIn, IsObject, ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const assessmentCategories = ['WEEKLY', 'MONTHLY', 'TERMINAL_1', 'TERMINAL_2', 'TERMINAL_3', 'FINAL', 'OTHER'] as const;

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

  @IsOptional()
  @IsIn(assessmentCategories)
  assessmentCategory?: typeof assessmentCategories[number];

  @IsOptional() @IsIn(['MCQ', 'STANDARD'])
  type?: string;

  @IsOptional() @IsString() @MaxLength(12)
  startTime?: string;

  @IsOptional() @IsString() @MaxLength(12)
  endTime?: string;

  @IsOptional() @IsString() @MaxLength(80)
  venue?: string;

  @IsOptional() @IsNumber() @IsInt() @Min(1) @Max(240)
  durationMinutes?: number;
}

export class UpdateAssessmentSchemeDto {
  @IsObject()
  categoryWeights: Record<string, number>;

  @IsArray()
  gradeBands: Array<{ minPercent: number; maxPercent: number; grade: string; gpa?: number }>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  templateUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  templateName?: string;
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

export class BulkExamResultRowDto {
  @IsString() @IsNotEmpty() @IsUUID()
  studentId: string;

  @IsNumber() @Min(0)
  marksObtained: number;

  @IsNumber() @Min(1)
  totalMarks: number;
}

export class BulkExamResultsDto {
  @IsString() @IsNotEmpty() @IsUUID()
  examId: string;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => BulkExamResultRowDto)
  results: BulkExamResultRowDto[];
}

export class UpdateExamDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsIn(assessmentCategories) assessmentCategory?: typeof assessmentCategories[number];
  @IsOptional() @IsIn(['MCQ', 'STANDARD']) type?: string;
  @IsOptional() @IsString() @MaxLength(12) startTime?: string;
  @IsOptional() @IsString() @MaxLength(12) endTime?: string;
  @IsOptional() @IsString() @MaxLength(80) venue?: string;
  @IsOptional() @IsNumber() @IsInt() @Min(1) @Max(240) durationMinutes?: number;
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
