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

  // Student specific fields
  @IsOptional() @IsString() @MaxLength(50) emisId?: string;
  @IsOptional() @IsString() @MaxLength(50) userId?: string; // Admission No
  @IsOptional() @IsDateString() dob?: string | null;
  @IsOptional() @IsString() @MaxLength(20) dobBs?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) gender?: string;
  @IsOptional() @IsString() @MaxLength(10) bloodGroup?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(500) temporaryAddress?: string;
  @IsOptional() @IsDateString() admissionDate?: string | null;
  @IsOptional() @IsString() @MaxLength(150) fatherName?: string;
  @IsOptional() @IsString() @MaxLength(30) fatherPhone?: string;
  @IsOptional() @IsString() @MaxLength(150) motherName?: string;
  @IsOptional() @IsString() @MaxLength(30) motherPhone?: string;
}

export class UpdateManagedUserDto {
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) lastName?: string;
  @IsOptional() @IsString() @MaxLength(50) grade?: string;
  @IsOptional() @IsString() @MaxLength(50) section?: string;
  @IsOptional() @IsString() @MaxLength(50) rollNo?: string;
  @IsOptional() @IsString() @MaxLength(100) department?: string;

  // Student specific fields
  @IsOptional() @IsString() @MaxLength(50) emisId?: string;
  @IsOptional() @IsString() @MaxLength(50) userId?: string; // Admission No
  @IsOptional() @IsDateString() dob?: string | null;
  @IsOptional() @IsString() @MaxLength(20) dobBs?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) gender?: string;
  @IsOptional() @IsString() @MaxLength(10) bloodGroup?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional() @IsString() @MaxLength(500) temporaryAddress?: string;
  @IsOptional() @IsDateString() admissionDate?: string | null;
  @IsOptional() @IsString() @MaxLength(150) fatherName?: string;
  @IsOptional() @IsString() @MaxLength(30) fatherPhone?: string;
  @IsOptional() @IsString() @MaxLength(150) motherName?: string;
  @IsOptional() @IsString() @MaxLength(30) motherPhone?: string;
}
