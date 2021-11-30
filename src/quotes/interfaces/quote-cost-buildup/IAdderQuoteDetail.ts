import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IAdderQuoteDetail extends IBaseQuoteCost {
  adderModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ADDER>;
  adderModelSnapshotDate: Date;
  quantity: number;
}
