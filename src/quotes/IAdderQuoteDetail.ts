import { PRODUCT_TYPE, PRICING_UNIT } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './interfaces/quote-cost-buildup/IBaseQuoteCost';

export interface IAdderQuoteDetail extends IBaseQuoteCost {
  adderModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ADDER>;
  adderModelSnapshotDate: Date;
  quantity: number;
  unit: PRICING_UNIT;
}
