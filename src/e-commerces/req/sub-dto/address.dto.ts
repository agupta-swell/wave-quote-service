import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddressDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    streetAddress: string;
  
    @ApiPropertyOptional()
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    aptOrSuite: string;
  
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    city: string;
  
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    state: string;
  
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    zip: number;
  
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    lat: number;
  
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    long: number;
  }