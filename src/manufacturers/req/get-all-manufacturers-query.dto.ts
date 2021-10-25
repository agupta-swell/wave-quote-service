import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PRODUCT_TYPE } from 'src/products-v2/constants';

export class GetAllManufacturersQueryDto {
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

  @ApiProperty({ required: false })
  @IsEnum(PRODUCT_TYPE)
  @IsOptional()
  by?: PRODUCT_TYPE;
}
