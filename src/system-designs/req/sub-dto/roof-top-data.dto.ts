import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { AdderDto } from './adder.dto';
import { InverterDto } from './inverter.dto';
import { SolarPanelArrayDto1 } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';

export class RoofTopDataReqDto {
  @ApiProperty({
    type: SolarPanelArrayDto1,
    isArray: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SolarPanelArrayDto1)
  panelArray: SolarPanelArrayDto1[];

  @ApiProperty({
    type: InverterDto,
    isArray: true,
  })
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @Type(() => InverterDto)
  inverters: InverterDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StorageDto)
  storage: StorageDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AdderDto)
  adders: AdderDto[];
}
