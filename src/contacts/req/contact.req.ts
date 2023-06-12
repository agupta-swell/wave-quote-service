import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ContactReqDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address1: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  zip: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cellPhone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  primaryPhone?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  businessPhone?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  lat?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  lng?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  county?: string;
}
