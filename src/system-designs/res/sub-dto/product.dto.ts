import { ApiProperty } from '@nestjs/swagger';
import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';

export class ProductDto {
  @ExposeProp()
  name: string;

  @ExposeProp()
  type: string;

  @ExposeProp()
  price: number;

  @ExposeProp()
  sizeW: number;

  @ExposeProp()
  sizekWh: number;

  @ExposeProp()
  partNumber: string[];

  @ExposeProp()
  manufacturerId: string;

  @ExposeProp()
  modelName: string;

  @ExposeProp()
  approvedForGsa: boolean;

  @ExposeProp()
  approvedForEsa: boolean;

  // For Panel
  @ExposeProp()
  pvWattModuleType?: string;

  @ExposeProp()
  panelOutputMode?: string;

  @ExposeProp()
  wattClassStcdc?: number;

  // For Inverter
  @ExposeProp()
  inverterType?: string;

  // For Storage/Battery
  @ExposeProp()
  batteryType?: string;

  @ExposeProp()
  dimension: {
    length: number;
    width: number;
  };
}
