import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { BATTERY_PURPOSE } from '../../constants';

export class StorageDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp({
    enum: [
      BATTERY_PURPOSE.BACKUP_POWER,
      BATTERY_PURPOSE.ADVANCED_TOU_SELF_CONSUMPTION,
      BATTERY_PURPOSE.PV_SELF_CONSUMPTION,
    ],
  })
  purpose: BATTERY_PURPOSE;

  @ExposeProp()
  storageModelId: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp({ type: ProductResDto })
  storageModelDataSnapshot: ProductResDto;

  @ExposeProp()
  storageModelSnapshotDate: Date;

  @ExposeProp()
  type: string;

  @ExposeProp()
  minimumReservePercentage: number;
}
