import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IInverterQuoteDetail extends IBaseQuoteCost {
  inverterModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.INVERTER>;
  inverterModelSnapshotDate: Date;
  quantity: number;
}
