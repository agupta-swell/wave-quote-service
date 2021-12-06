import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IStorageQuoteDetail extends IBaseQuoteCost {
  storageModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BATTERY>;
  storageModelSnapshotDate: Date;
  quantity: number;
}
