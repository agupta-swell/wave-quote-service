import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { BATTERY_TYPE } from 'src/products-v2/constants';
import { IBatteryRating } from 'src/products-v2/interfaces';
import { BATTERY_PURPOSE } from 'src/system-designs/constants';

export class RatingsDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  kilowatts?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  kilowattHours?: number;
}

export class ModifyExistingSystemStorageReqDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  yearInstalled: number;

  @ApiProperty()
  @IsEnum(BATTERY_PURPOSE)
  purpose: string;

  @ApiProperty()
  @IsString()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  name?: string;

  @ApiProperty()
  @IsMongoId()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  manufacturerId?: string;

  @ApiProperty()
  @IsEnum(BATTERY_TYPE)
  batteryType: BATTERY_TYPE;

  @ApiProperty()
  @ValidateNested()
  @Type(() => RatingsDto)
  ratings: IBatteryRating;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  roundTripEfficiency?: number;
}
