import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';

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
  @Min(1)
  monthlyUtilityBill: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  depositAmount: number;
}
