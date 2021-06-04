import { ExposeProp } from 'src/shared/decorators';

export class AncillaryEquipmentDto {
  @ExposeProp()
  manufacturerId: string;

  @ExposeProp()
  modelName: string;

  @ExposeProp()
  relatedComponent: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  averageWholeSalePrice: number;

  @ExposeProp()
  applicableProductManufacturerId: string;

  @ExposeProp()
  quantity: number;
}
