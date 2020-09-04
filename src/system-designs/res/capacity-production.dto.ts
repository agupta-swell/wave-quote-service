import { ApiProperty } from '@nestjs/swagger';
import { InverterDto } from './inverter.dto';
import { StorageDto } from './storage.dto';

export class CapacityProductionDataDto {
  @ApiProperty()
  capacity: number;

  @ApiProperty()
  production: number;

  @ApiProperty()
  numberOfPanels: number;

  @ApiProperty()
  panelModelId: number;

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
}
