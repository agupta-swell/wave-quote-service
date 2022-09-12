import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsMongoId, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { INVERTER_TYPE } from 'src/products-v2/constants';
import { Default } from 'src/shared/decorators';
import { FINANCE_TYPE_EXISTING_SOLAR } from 'src/system-designs/constants';
import { ModifyExistingSystemArrayDto } from './modify-existing-system-array.dto';
import { ModifyExistingSystemStorageReqDto } from './modify-existing-system-storage.dto';

export class UpdateExistingSystemDto {
  @ApiProperty()
  @IsBoolean()
  @Default()
  hasGrantedHomeBatterySystemRights: boolean;

  @ApiProperty()
  @IsBoolean()
  @Default()
  hasHadOtherDemandResponseProvider: boolean;

  @ApiProperty()
  @IsBoolean()
  @Default()
  interconnectedWithExistingSystem: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  originalInstaller: string;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  yearSystemInstalled: number;

  @ApiProperty()
  @IsEnum(INVERTER_TYPE)
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  inverterType: INVERTER_TYPE;

  @ApiProperty()
  @IsMongoId()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsOptional()
  inverterManufacturerId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  inverterModel: string;

  @ApiProperty()
  @IsEnum(FINANCE_TYPE_EXISTING_SOLAR)
  @IsOptional()
  financeType: FINANCE_TYPE_EXISTING_SOLAR;

  @ApiProperty()
  @IsString()
  @ValidateIf(o => o?.financeType === FINANCE_TYPE_EXISTING_SOLAR.TPO)
  @IsOptional()
  tpoFundingSource?: string;

  @ApiProperty({
    type: [ModifyExistingSystemArrayDto],
  })
  @Type(() => ModifyExistingSystemArrayDto)
  @ValidateNested({ each: true })
  @IsOptional()
  array?: ModifyExistingSystemArrayDto[];

  @ApiProperty({
    type: [ModifyExistingSystemStorageReqDto],
  })
  @Type(() => ModifyExistingSystemStorageReqDto)
  @IsOptional()
  @ValidateNested({ each: true })
  storages?: ModifyExistingSystemStorageReqDto[];
}
