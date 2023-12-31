import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';
import { AddressDto } from './sub-dto/address.dto';

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
