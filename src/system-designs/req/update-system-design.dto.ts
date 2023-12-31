import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Default } from 'src/shared/decorators';
import { DESIGN_MODE } from '../constants';
import { CapacityProductionDataDto, RoofTopDataReqDto, SunroofDriftCorrectionReqDto } from './sub-dto';

export class UpdateSystemDesignDto {
  @ApiProperty()
  @IsString()
  opportunityId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: [DESIGN_MODE.ROOF_TOP, DESIGN_MODE.CAPACITY_PRODUCTION] })
  @IsOptional()
  designMode: DESIGN_MODE;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnail: string;

  @ApiPropertyOptional({ type: RoofTopDataReqDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoofTopDataReqDto)
  roofTopDesignData: RoofTopDataReqDto;

  @ApiPropertyOptional({ type: CapacityProductionDataDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapacityProductionDataDto)
  capacityProductionDesignData: CapacityProductionDataDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSolar: boolean;

  @ApiProperty()
  @IsBoolean()
  @Default()
  isRetrofit: boolean;

  @ApiPropertyOptional({ type: SunroofDriftCorrectionReqDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SunroofDriftCorrectionReqDto)
  sunroofDriftCorrection?: SunroofDriftCorrectionReqDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  existingSystemId?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
