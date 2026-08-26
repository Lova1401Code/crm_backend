import {
  IsEmail, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString() @IsNotEmpty()
  firstname: string;

  @IsString() @IsNotEmpty()
  lastname: string;

  @IsString() @IsOptional()
  company?: string;

  @IsEmail() @IsOptional()
  email?: string;

  @IsString() @IsOptional()
  phone?: string;

  @IsString() @IsOptional()
  address?: string;

  @IsString() @IsOptional()
  city?: string;

  @IsString() @IsOptional()
  country?: string;

  @IsString() @IsOptional()
  ownerId?: string;
}

export class UpdateCustomerDto {
  @IsString() @IsOptional() firstname?: string;
  @IsString() @IsOptional() lastname?: string;
  @IsString() @IsOptional() company?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() city?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() ownerId?: string;
}