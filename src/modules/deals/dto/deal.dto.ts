import {
  IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() customerId: string;
  @Type(() => Number) @IsNumber() amount?: number;
  @IsEnum(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']) @IsOptional()
  stage?: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  @IsString() @IsOptional() expectedCloseDate?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() ownerId?: string;
}

export class UpdateDealDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() customerId?: string;
  @Type(() => Number) @IsNumber() @IsOptional() amount?: number;
  @IsEnum(['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']) @IsOptional()
  stage?: 'PROSPECT' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  @IsString() @IsOptional() expectedCloseDate?: string;
  @IsString() @IsOptional() notes?: string;
  @IsString() @IsOptional() ownerId?: string;
}