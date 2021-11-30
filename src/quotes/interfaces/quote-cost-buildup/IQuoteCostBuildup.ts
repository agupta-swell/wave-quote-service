import { Document } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IQuoteCost } from '.';

export interface IQuoteCostBuildup {
  panelQuoteDetails: IQuoteCost<PRODUCT_TYPE.MODULE>[];
  inverterQuoteDetails: IQuoteCost<PRODUCT_TYPE.INVERTER>[];
  storageQuoteDetails: IQuoteCost<PRODUCT_TYPE.BATTERY>[];
  adderQuoteDetails: IQuoteCost<PRODUCT_TYPE.ADDER>[];
  balanceOfSystemDetails: IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM>[];
  ancillaryEquipmentDetails: IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>[];
  laborCostQuoteDetails: IQuoteCost<PRODUCT_TYPE.LABOR>[];
  softCostQuoteDetails: IQuoteCost<PRODUCT_TYPE.SOFT_COST>[];
  swellStandardMarkup: number;
  grossPrice: number;
  totalProductCost: number;
}

export type IQuoteCostBuildupDocument = Document &
  {
    [key in keyof IQuoteCostBuildup]: IQuoteCostBuildup[key] extends Array<infer T>
      ? Array<T & Document>
      : IQuoteCostBuildup[key];
  };
