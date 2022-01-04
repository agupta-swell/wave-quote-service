import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeProp } from 'src/shared/decorators';
export class BalanceOfSystemDto {
  @ExposeProp()
  balanceOfSystemId: string;

  @ExposeProp()
  quantity: number;

  @ExposeProp()
  balanceOfSystemSnapshotDate: Date;

  @ExposeProp({ type: ProductResDto })
  balanceOfSystemModelDataSnapshot: ProductResDto;
}
