import {
  IsEnum, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class CreateNoteDto {
  @IsString() @IsNotEmpty() content: string;
  @IsEnum(['CUSTOMER', 'LEAD', 'DEAL']) relatedType: 'CUSTOMER' | 'LEAD' | 'DEAL';
  @IsString() @IsNotEmpty() relatedId: string;
}

export class UpdateNoteDto {
  @IsString() @IsOptional() content?: string;
}