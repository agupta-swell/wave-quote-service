import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IBaseQuoteCost } from './IBaseQuoteCost';

export interface IAncillaryEquipmentQuoteDetail extends IBaseQuoteCost {
  ancillaryEquipmentModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>;
  ancillaryEquipmentModelSnapshotDate: Date;
  quantity: number;
}
