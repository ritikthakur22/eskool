import { ArrayMaxSize, IsArray, IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) lastName?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MaxLength(100) studentId?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) gender?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(150) parentName?: string;
  @IsOptional() @IsString() @MaxLength(30) parentPhone?: string;
  @IsOptional() @IsDateString() dob?: string | null;
}

export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(128) currentPassword!: string;
  @IsString() @MinLength(8) @MaxLength(128) newPassword!: string;
}

export class CreateUserDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsUUID() schoolId?: string;
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(50) grade?: string;
  @IsOptional() @IsString() @MaxLength(50) section?: string;
  @IsOptional() @IsString() @MaxLength(50) rollNo?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) subjects?: string[];
}

export class UpdateManagedUserDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(50) grade?: string;
  @IsOptional() @IsString() @MaxLength(50) section?: string;
  @IsOptional() @IsString() @MaxLength(50) rollNo?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;
}
