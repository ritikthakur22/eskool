import { IsString, IsNotEmpty, IsDateString, IsOptional, MaxLength, IsArray, IsUUID } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  category: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  targetClassIds?: string[];
}

export class UpdateNoticeDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(160) title?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(10000) content?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(40) category?: string;
  @IsDateString() @IsOptional() date?: string;
  @IsArray() @IsUUID('4', { each: true }) @IsOptional() targetClassIds?: string[];
}
