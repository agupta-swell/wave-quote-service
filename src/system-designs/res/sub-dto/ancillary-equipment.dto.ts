import { ApiProperty } from '@nestjs/swagger';

export class AncillaryEquipmentDto {
  @ApiProperty()
  manufacturerId: string;

  @ApiProperty()
  modelName: string;

  @ApiProperty()
  relatedComponent: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  averageWholeSalePrice: number;

  @ApiProperty()
  applicableProductManufacturerId: string;
}
