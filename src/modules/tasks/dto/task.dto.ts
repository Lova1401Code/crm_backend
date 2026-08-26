import {
  IsEnum, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsNotEmpty() dueDate: string;
  @IsEnum(['LOW', 'MEDIUM', 'HIGH']) @IsOptional() priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  @IsEnum(['OPEN', 'DONE']) @IsOptional() status?: 'OPEN' | 'DONE';
  @IsEnum(['CUSTOMER', 'LEAD', 'DEAL']) @IsOptional() relatedType?: 'CUSTOMER' | 'LEAD' | 'DEAL';
  @IsString() @IsOptional() relatedId?: string;
  @IsString() @IsOptional() ownerId?: string;
}

export class UpdateTaskDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() dueDate?: string;
  @IsEnum(['LOW', 'MEDIUM', 'HIGH']) @IsOptional() priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  @IsEnum(['OPEN', 'DONE']) @IsOptional() status?: 'OPEN' | 'DONE';
  @IsEnum(['CUSTOMER', 'LEAD', 'DEAL']) @IsOptional() relatedType?: 'CUSTOMER' | 'LEAD' | 'DEAL';
  @IsString() @IsOptional() relatedId?: string;
  @IsString() @IsOptional() ownerId?: string;
}