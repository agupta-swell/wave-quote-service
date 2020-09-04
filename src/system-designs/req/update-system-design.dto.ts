import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { DESIGN_MODE } from '../constants';
import { CapacityProductionDataDto } from './capacity-production.dto';
import { RoofTopDataDto } from './roof-top-data.dto';

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

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  longtitude: number;

  @ApiPropertyOptional({ type: RoofTopDataDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoofTopDataDto)
  roofTopDesignData: RoofTopDataDto;

  @ApiPropertyOptional({ type: CapacityProductionDataDto })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CapacityProductionDataDto)
  capacityProductionDesignData: CapacityProductionDataDto;
}
