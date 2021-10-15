import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { INVERTER_TYPE } from '../../constants';

export class InverterDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp({ enum: [INVERTER_TYPE.MICRO, INVERTER_TYPE.STRING] })
  type: INVERTER_TYPE;

  @ExposeProp()
  inverterModelId: string;

  @ExposeProp({ type: ProductResDto })
  inverterModelDataSnapshot: ProductResDto;

  @ExposeProp()
  inverterModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;

  @ExposeAndMap({}, ({ obj }) => obj.arrayId)
  arrayId: string;
}
