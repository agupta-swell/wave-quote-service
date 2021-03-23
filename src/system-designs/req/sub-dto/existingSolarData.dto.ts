import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, ValidateIf } from 'class-validator';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class ExistingSolarDataDto {
  @ApiProperty()
  @IsString()
  originalInstaller: string;

  @ApiProperty()
  @IsNumber()
  existingPVSize: number;

  @ApiProperty()
  @IsNumber()
  yearSystemInstalled: number;

  @ApiProperty({ enum: INVERTER_TYPE_EXISTING_SOLAR })
  @IsEnum(INVERTER_TYPE_EXISTING_SOLAR)
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiProperty({ enum: FINANCE_TYPE_EXISTING_SOLAR })
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsString()
  inverterManufacturer: string;

  @ApiProperty()
  @IsString()
  inverterModel: string;

  @ApiProperty()
  @ValidateIf(o => o.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO)
  @IsString()
  tpoFundingSource?: string;
}
