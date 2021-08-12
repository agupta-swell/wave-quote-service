import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { INVERTER_TYPE } from '../../constants';
import { ProductDto } from './product.dto';

export class InverterDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp({ enum: [INVERTER_TYPE.MICRO, INVERTER_TYPE.STRING] })
  type: INVERTER_TYPE;

  @ExposeProp()
  inverterModelId: string;

  @ExposeProp({ type: ProductDto })
  inverterModelDataSnapshot: ProductDto;

  @ExposeProp()
  inverterModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;

  @ExposeAndMap({}, ({ obj }) => obj.arrayId)
  arrayId: string;
}
