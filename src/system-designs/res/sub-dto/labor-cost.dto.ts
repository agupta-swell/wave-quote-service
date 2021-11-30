import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeProp } from 'src/shared/decorators';

export class LaborCostDto {
  @ExposeProp()
  laborCostId: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp()
  laborCostSnapshotDate: Date;

  @ExposeProp({ type: ProductResDto })
  laborCostModelDataSnapshot: ProductResDto;
}
