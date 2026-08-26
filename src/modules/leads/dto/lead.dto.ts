import {
  IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class CreateLeadDto {
  @IsString() @IsNotEmpty() firstname: string;
  @IsString() @IsNotEmpty() lastname: string;
  @IsString() @IsOptional() company?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() source?: string;
  @IsEnum(['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED']) @IsOptional()
  status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED';
  @IsString() @IsOptional() ownerId?: string;
}

export class UpdateLeadDto {
  @IsString() @IsOptional() firstname?: string;
  @IsString() @IsOptional() lastname?: string;
  @IsString() @IsOptional() company?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @IsOptional() source?: string;
  @IsEnum(['NEW', 'CONTACTED', 'INTERESTED', 'NEGOTIATING', 'CONVERTED']) @IsOptional()
  status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NEGOTIATING' | 'CONVERTED';
  @IsString() @IsOptional() ownerId?: string;
}