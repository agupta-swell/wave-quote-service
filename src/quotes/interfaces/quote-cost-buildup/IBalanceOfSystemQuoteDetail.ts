import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IBalanceOfSystemQuoteDetail extends IBaseQuoteCost {
  balanceOfSystemModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BALANCE_OF_SYSTEM>;
  balanceOfSystemModelSnapshotDate: Date;
}
