import { IsString, IsNotEmpty, MinLength, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus, UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString() @IsNotEmpty() username: string;
  @IsString() @IsNotEmpty() @MinLength(6) password: string;
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() phone: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() department?: string;
  @IsString() @IsOptional() position?: string;
  @IsString() @IsOptional() avatar?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @IsEnum(UserStatus) @IsOptional() status?: UserStatus;
  @IsString() @IsOptional() superiorId?: string;
}

export class UpdateUserDto {
  @IsString() @IsOptional() username?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() department?: string;
  @IsString() @IsOptional() position?: string;
  @IsString() @IsOptional() avatar?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
  @IsEnum(UserStatus) @IsOptional() status?: UserStatus;
  @IsString() @IsOptional() superiorId?: string;
  @IsString() @MinLength(6) @IsOptional() password?: string;
}

export class QueryUserDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(UserRole) role?: UserRole;
  @IsOptional() @IsEnum(UserStatus) status?: UserStatus;
  @IsOptional() @Type(() => Number) page?: number;
  @IsOptional() @Type(() => Number) pageSize?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: 'ASC' | 'DESC';
}
