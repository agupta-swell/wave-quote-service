import { Document } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IBaseQuoteCost } from './IBaseQuoteCost';
import { IQuoteCost } from './IQuoteCost';
import { IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards } from './IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards';
import { IAdditionalFees, IBaseCostBuildupFee } from './ICostBuildupFee';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from './ITotalPromotionsDiscountsGridrewards';

export interface IQuoteCostBuildup {
  panelQuoteDetails: IQuoteCost<PRODUCT_TYPE.MODULE>[];
  inverterQuoteDetails: IQuoteCost<PRODUCT_TYPE.INVERTER>[];
  storageQuoteDetails: IQuoteCost<PRODUCT_TYPE.BATTERY>[];
  adderQuoteDetails: IQuoteCost<PRODUCT_TYPE.ADDER>[];
  balanceOfSystemDetails: IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM>[];
  ancillaryEquipmentDetails: IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>[];
  laborCostQuoteDetails: IQuoteCost<PRODUCT_TYPE.LABOR>[];
  softCostQuoteDetails: IQuoteCost<PRODUCT_TYPE.SOFT_COST>[];
  generalMarkup: number;
  grossPrice: number;
  equipmentSubtotal: IBaseQuoteCost;
  equipmentAndLaborSubtotal: IBaseQuoteCost;
  equipmentLaborAndAddersSubtotal: IBaseQuoteCost;
  projectGrossTotal: IBaseQuoteCost;
  projectSubtotalWithDiscountsPromotionsAndSwellGridrewards: IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards;
  totalPromotionsDiscountsAndSwellGridrewards: ITotalPromotionsDiscountsAndSwellGridrewards;
  salesOriginationManagerFee: IBaseCostBuildupFee;
  salesOriginationSalesFee: IBaseCostBuildupFee;
  subtotalWithSalesOriginationManagerFee: number;
  additionalFees: IAdditionalFees;
  projectGrandTotal: IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards;
}

export type IQuoteCostBuildupDocument = Document &
  {
    [key in keyof IQuoteCostBuildup]: IQuoteCostBuildup[key] extends Array<infer T>
      ? Array<T & Document>
      : IQuoteCostBuildup[key];
  };
