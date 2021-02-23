import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  sizeW: number;

  @ApiProperty()
  sizekWh: number;

  @ApiProperty()
  partNumber: string[];

  @ApiProperty()
  manufacturerId: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  approvedForGsa: boolean;

  @ApiProperty()
  approvedForEsa: boolean;

  // For Panel
  @ApiProperty()
  pvWattModuleType?: string;

  @ApiProperty()
  panelOutputMode?: string;

  @ApiProperty()
  wattClassStcdc?: number;

  // For Inverter
  @ApiProperty()
  inverterType?: string;

  // For Storage/Battery
  @ApiProperty()
  batteryType?: string;
}
