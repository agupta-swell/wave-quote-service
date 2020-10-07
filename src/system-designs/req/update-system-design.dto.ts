import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DESIGN_MODE } from '../constants';
import { CapacityProductionDataDto, RoofTopDataReqDto } from './sub-dto';

export class UpdateSystemDesignDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opportunityId: string;

  @ApiPropertyOptional()
  @IsOptional()
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
  longtitude: number;

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
  isSelected: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSolar: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRetrofit: boolean;
}
