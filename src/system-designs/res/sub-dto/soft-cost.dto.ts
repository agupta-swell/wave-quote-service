import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeProp } from 'src/shared/decorators';

export class SoftCostDto {
  @ExposeProp()
  softCostId: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp()
  softCostSnapshotDate: Date;

  @ExposeProp({ type: ProductResDto })
  softCostModelDataSnapshot: ProductResDto;
}
