import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface ISoftCostQuoteDetail extends IBaseQuoteCost {
  softCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>;
  softCostSnapshotDate: Date;
  quantity: number;
}
