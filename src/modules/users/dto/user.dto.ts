import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty()
  firstname: string;

  @IsString() @IsNotEmpty()
  lastname: string;

  @IsEmail()
  email: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsEnum(['ADMIN', 'COMMERCIAL'])
  role?: 'ADMIN' | 'COMMERCIAL';

  @IsString() @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @IsString() @IsOptional()
  firstname?: string;

  @IsString() @IsOptional()
  lastname?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsEnum(['ADMIN', 'COMMERCIAL']) @IsOptional()
  role?: 'ADMIN' | 'COMMERCIAL';

  @IsEnum(['ACTIVE', 'DISABLED']) @IsOptional()
  status?: 'ACTIVE' | 'DISABLED';

  @IsString() @MinLength(6) @IsOptional()
  password?: string;
}