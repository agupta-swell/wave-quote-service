import { ApiProperty } from '@nestjs/swagger';
import { AdderDto } from './adder.dto';
import { InverterDto } from './inverter.dto';
import { SolarPanelArrayDto } from './solar-panel-array.dto';
import { StorageDto } from './storage.dto';

export class RoofTopDataDto {
  @ApiProperty({
    type: SolarPanelArrayDto,
    isArray: true,
  })
  panelArray: SolarPanelArrayDto[];

  @ApiProperty({
    type: InverterDto,
    isArray: true,
  })
  inverters: InverterDto[];

  @ApiProperty({
    type: StorageDto,
    isArray: true,
  })
  storage: StorageDto[];

  @ApiProperty({
    type: AdderDto,
    isArray: true,
  })
  adders: AdderDto[];
}
