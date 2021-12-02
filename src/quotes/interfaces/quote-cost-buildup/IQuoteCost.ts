import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { Document } from 'mongoose';
import { IBaseQuoteCost } from './IBaseQuoteCost';
import { IPanelQuoteDetail } from './IPanelQuoteDetail';
import { IInverterQuoteDetail } from './IInverterQuoteDetail';
import { IStorageQuoteDetail } from './IStorageQuoteDetail';
import { IAdderQuoteDetail } from './IAdderQuoteDetail';
import { IBalanceOfSystemQuoteDetail } from './IBalanceOfSystemQuoteDetail';
import { IAncillaryEquipmentQuoteDetail } from './IAncillaryEquipmentQuoteDetail';
import { ILaborQuoteDetail } from './ILaborQuoteDetail';
import { ISoftCostQuoteDetail } from './ISoftCostQuoteDetail';

type MappedProductQuoteCost = {
  [key in PRODUCT_TYPE]: IBaseQuoteCost;
};

interface IMappedProductQuoteCost extends MappedProductQuoteCost {
  [PRODUCT_TYPE.ADDER]: IAdderQuoteDetail;
  [PRODUCT_TYPE.ANCILLARY_EQUIPMENT]: IAncillaryEquipmentQuoteDetail;
  [PRODUCT_TYPE.BALANCE_OF_SYSTEM]: IBalanceOfSystemQuoteDetail;
  [PRODUCT_TYPE.BATTERY]: IStorageQuoteDetail;
  [PRODUCT_TYPE.INVERTER]: IInverterQuoteDetail;
  [PRODUCT_TYPE.MODULE]: IPanelQuoteDetail;
  [PRODUCT_TYPE.SOFT_COST]: ISoftCostQuoteDetail;
  [PRODUCT_TYPE.LABOR]: ILaborQuoteDetail;
}

export type IQuoteCost<T extends PRODUCT_TYPE | unknown> = T extends PRODUCT_TYPE
  ? IMappedProductQuoteCost[T]
  : IBaseQuoteCost;

export type IQuoteCostDocument<T extends PRODUCT_TYPE> = T extends PRODUCT_TYPE
  ? Document & IQuoteCost<T>
  : Document & IBaseQuoteCost;
