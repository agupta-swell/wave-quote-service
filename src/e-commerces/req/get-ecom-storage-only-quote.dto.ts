import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AddressDto } from './sub-dto/address.dto';

export class GetEcomStorageOnlyQuoteReq {
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
  depositAmount: number;
}
