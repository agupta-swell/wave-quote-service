import { ApiParam, ApiProperty, ApiQuery } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { getBooleanString } from 'src/utils/common';
import { PRODUCT_TYPE } from '../constants';

export class GetAllProductsQueryDto {
  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => {
    return +value || 100;
  })
  limit = 100;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => +value || 0)
  skip = 0;

  @ApiProperty({ type: String })
  @IsArray()
  @IsEnum(PRODUCT_TYPE, { each: true })
  @Transform(({ value }) => value && value.split(','))
  types: PRODUCT_TYPE[];

  @ApiProperty({ name: 'has-rule', required: false, type: String })
  @IsBoolean()
  @IsOptional()
  @Expose({ name: 'has-rule' })
  @Transform(({ value }) => (value ? getBooleanString(value) : null))
  hasRule: boolean | null;
}
