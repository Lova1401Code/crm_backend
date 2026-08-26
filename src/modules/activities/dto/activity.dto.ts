import {
  IsEnum, IsNotEmpty, IsOptional, IsString,
} from 'class-validator';

export class CreateActivityDto {
  @IsEnum(['CALL', 'EMAIL', 'MEETING', 'EVENT']) @IsOptional()
  type?: 'CALL' | 'EMAIL' | 'MEETING' | 'EVENT';

  @IsString() @IsNotEmpty() subject: string;

  @IsString() @IsOptional() description?: string;

  @IsEnum(['CUSTOMER', 'LEAD', 'DEAL']) relatedType: 'CUSTOMER' | 'LEAD' | 'DEAL';

  @IsString() @IsNotEmpty() relatedId: string;

  @IsString() @IsOptional() ownerId?: string;
}