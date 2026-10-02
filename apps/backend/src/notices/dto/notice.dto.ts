import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
