import { IsArray, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;
}
