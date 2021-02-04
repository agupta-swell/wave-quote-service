import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AncillaryEquipmentDto {
  @ApiProperty()
  manufacturer: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  relatedComponent: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsNumber()
  averageWholeSalePrice: number;

  @ApiProperty()
  applicableProductManufacturer: string;
}
