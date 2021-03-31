import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class AddressDto {
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

export class GetEcomSystemDesignAndQuoteReq {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ecomVisitId: string;

  @ApiProperty({ type: AddressDto })
  @Type(() => AddressDto)
  @IsNotEmpty()
  @ValidateNested()
  addressDataDetail: AddressDto;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  monthlyUtilityBill: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  depositAmount: number;
}
