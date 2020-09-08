import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DESIGN_MODE } from './../constants';
import { CapacityProductionDataDto } from './capacity-production.dto';
import { RoofTopDataDto } from './roof-top-data.dto';

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

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => RoofTopDataDto)
  roofTopDesignData: RoofTopDataDto;

  @ApiPropertyOptional({ type: CapacityProductionDataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CapacityProductionDataDto)
  capacityProductionDesignData: CapacityProductionDataDto;
}
