import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface ILaborQuoteDetail extends IBaseQuoteCost {
  laborCostModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.LABOR>;
  laborCostModelSnapshotDate: Date;
  quantity: number;
}
