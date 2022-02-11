import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class ExistingSolarDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originalInstaller?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  existingPVSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yearSystemInstalled?: number;

  @ApiPropertyOptional({ enum: INVERTER_TYPE_EXISTING_SOLAR })
  @IsOptional()
  @IsEnum(INVERTER_TYPE_EXISTING_SOLAR)
  inverter?: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiPropertyOptional({ enum: FINANCE_TYPE_EXISTING_SOLAR })
  @IsOptional()
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  financeType?: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inverterManufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inverterModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf(o => o.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO)
  @IsString()
  tpoFundingSource?: string;
}
