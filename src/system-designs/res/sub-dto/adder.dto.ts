import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class AdderDto {
  @ExposeProp()
  adderDescription: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp()
  adderId: string;

  @ExposeProp({ type: ProductResDto })
  adderModelDataSnapshot: ProductResDto;

  @ExposeProp()
  adderModelSnapshotDate: Date;
}
