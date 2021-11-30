import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IPanelQuoteDetail extends IBaseQuoteCost {
  panelModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.MODULE>;
  panelModelSnapshotDate: Date;
  quantity: number;
}
