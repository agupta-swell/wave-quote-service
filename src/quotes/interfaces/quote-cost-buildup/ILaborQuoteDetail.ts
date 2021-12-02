import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface ILaborQuoteDetail extends IBaseQuoteCost {
  laborCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.LABOR>;
  laborCostSnapshotDate: Date;
  quantity: number;
}
