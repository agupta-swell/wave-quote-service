import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';

export class AncillaryEquipmentDto {
  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  manufacturerId: string;

  @ExposeProp()
  ancillaryId: string;

  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  modelName: string;

  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  relatedComponent: string;

  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  description: string;

  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  averageWholeSalePrice: number;

  @ExposeAndMap({ root: 'ancillaryEquipmentModelDataSnapshot', checkParent: true })
  applicableProductManufacturerId: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp({ type: ProductResDto })
  ancillaryEquipmentModelDataSnapshot: ProductResDto;
}
