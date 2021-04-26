import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';
import { DESIGN_MODE } from '../constants';
import { CapacityProductionDataDto, RoofTopDataReqDto } from './sub-dto';
import { ExistingSolarDataDto } from './sub-dto/existing-solar.dto';

export class CreateSystemDesignDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opportunityId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: [DESIGN_MODE.ROOF_TOP, DESIGN_MODE.CAPACITY_PRODUCTION] })
  @IsNotEmpty()
  designMode: DESIGN_MODE;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  longtitude: number;

  @ApiPropertyOptional()
  @IsString()
  thumbnail: string;

  @ApiPropertyOptional({ type: RoofTopDataReqDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoofTopDataReqDto)
  roofTopDesignData: RoofTopDataReqDto;

  @ApiPropertyOptional({ type: CapacityProductionDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityProductionDataDto)
  capacityProductionDesignData: CapacityProductionDataDto;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsBoolean()
  // isSelected: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isSolar: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isRetrofit: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasHadOtherDemandResponseProvider: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasGrantedHomeBatterySystemRights: boolean;

  @ApiPropertyOptional({ type: ExistingSolarDataDto })
  @ValidateIf(o => o.isRetrofit)
  @ValidateNested({ each: true })
  @Type(() => ExistingSolarDataDto)
  existingSolarData: ExistingSolarDataDto;
}
