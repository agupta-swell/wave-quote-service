import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

class AddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  aptOrSuite: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
  ecomReferenceId: string;

  @ApiProperty({ type: AddressDto })
  @Type(() => AddressDto)
  @IsNotEmpty()
  @ValidateNested()
  addressDataDetail: AddressDto;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  monthlyUtilityBill: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  depositAmount: number;
}
