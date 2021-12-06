import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';

export class DiscountReqDto {
  @ApiProperty()
  @IsMongoId()
  id: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsEnum(DISCOUNT_TYPE)
  type: DISCOUNT_TYPE;
}
