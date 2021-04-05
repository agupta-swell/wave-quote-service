import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { RATE_NAME_TYPE } from 'src/saving-calculations/constants';

export class LoadDataDto {
  @ApiProperty()
  @IsNumber()
  annualLoad: number;

  @ApiProperty({ enum: RATE_NAME_TYPE })
  @IsEnum(RATE_NAME_TYPE)
  bauRateType: RATE_NAME_TYPE;

  @ApiProperty({ enum: RATE_NAME_TYPE })
  @IsEnum(RATE_NAME_TYPE)
  pvRateType: RATE_NAME_TYPE;

  @ApiProperty({ enum: RATE_NAME_TYPE })
  @IsEnum(RATE_NAME_TYPE)
  storageRateType: RATE_NAME_TYPE;
}
