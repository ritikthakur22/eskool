import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength, IsUUID, IsUrl, Matches } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  classId?: string;
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
  @Matches(/^https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw)\/upload\//, { message: 'Homework attachments must use the school media storage.' })
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

export class UpdateHomeworkDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(5000) description?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
