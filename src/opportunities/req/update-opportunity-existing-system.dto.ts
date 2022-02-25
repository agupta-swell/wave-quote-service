import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { FINANCE_TYPE_EXISTING_SOLAR, INVERTER_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';

export class UpdateOpportunityExistingSystemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  existingPV: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  hasGrantedHomeBatterySystemRights: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  hasHadOtherDemandResponseProvider: boolean;

  @ApiProperty()
  @IsOptional()
  originalInstaller: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  existingPVSize: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  @Min(1000)
  yearSystemInstalled: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(INVERTER_TYPE_EXISTING_SOLAR)
  inverter: INVERTER_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsOptional()
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsOptional()
  inverterManufacturer: string;

  @ApiProperty()
  @IsOptional()
  inverterModel: string;

  @ApiProperty()
  @IsOptional()
  tpoFundingSource: string;
}
