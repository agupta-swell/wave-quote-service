import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Default } from 'src/shared/decorators';
import { DESIGN_MODE } from '../constants';
import { CapacityProductionDataDto, RoofTopDataReqDto, SunroofDriftCorrectionReqDto } from './sub-dto';

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
  @IsEnum(DESIGN_MODE)
  @IsNotEmpty()
  designMode: DESIGN_MODE;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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

  @ApiPropertyOptional({ type: SunroofDriftCorrectionReqDto })
  @ValidateNested()
  @Type(() => SunroofDriftCorrectionReqDto)
  @Default({ x: 0, y: 0 })
  sunroofDriftCorrection: SunroofDriftCorrectionReqDto;

  @ApiProperty()
  @IsBoolean()
  @Default(false)
  isArchived: boolean;
}
