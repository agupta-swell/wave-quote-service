import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class UpdateOpportunityExistingSystemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  existingPV: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  hasGrantedHomeBatterySystemRights: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  hasHadOtherDemandResponseProvider: boolean;

  @ApiProperty()
  @IsNotEmpty()
  originalInstaller: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  existingPVSize: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1000)
  yearSystemInstalled: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(INVERTER_TYPE_EXISTING_SOLAR)
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsNotEmpty()
  inverterManufacturer: string;

  @ApiProperty()
  @IsNotEmpty()
  inverterModel: string;

  @ApiProperty()
  @IsOptional()
  tpoFundingSource: string;
}
