import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class ExistingSolarDataDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  originalInstaller?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  existingPVSize?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  yearSystemInstalled?: number;

  @ApiProperty({ enum: INVERTER_TYPE_EXISTING_SOLAR })
  @IsNotEmpty()
  @IsEnum(INVERTER_TYPE_EXISTING_SOLAR)
  inverter?: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiProperty({ enum: FINANCE_TYPE_EXISTING_SOLAR })
  @IsNotEmpty()
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  financeType?: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inverterManufacturer?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  inverterModel?: string;

  @ApiProperty()
  @IsOptional()
  @ValidateIf(o => o.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO)
  @IsString()
  tpoFundingSource?: string;
}
