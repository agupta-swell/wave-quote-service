import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';

export class AncillaryEquipmentModelDataSnapshotDto {
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
  quantity: number;

  @ExposeProp()
  applicableProductManufacturerId: string;
}

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

  @ExposeProp({ type: AncillaryEquipmentModelDataSnapshotDto })
  ancillaryEquipmentModelDataSnapshot: AncillaryEquipmentModelDataSnapshotDto;
}
