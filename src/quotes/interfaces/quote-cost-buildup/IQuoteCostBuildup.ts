import { Document, LeanDocument } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { QuotePartnerConfig } from 'src/quote-partner-configs/quote-partner-config.schema';
import { QuoteCostBuildupUserInputDto } from 'src/quotes/res/sub-dto';
import { FinancialProduct } from 'src/financial-products/financial-product.schema';
import { IBaseQuoteCost } from './IBaseQuoteCost';
import { IQuoteCost } from './IQuoteCost';
import { IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards } from './IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards';
import { IAdditionalFees, IBaseCostBuildupFee, ICashDiscount } from './ICostBuildupFee';
import { ITotalPromotionsDiscountsAndSwellGridrewards } from './ITotalPromotionsDiscountsGridrewards';
import { ICreateQuoteCostBuildUpArg } from '.';

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
  equipmentSubtotal: IBaseQuoteCost;
  equipmentAndLaborSubtotal: IBaseQuoteCost;
  equipmentLaborAndAddersSubtotal: IBaseQuoteCost;
  projectGrossTotal: IBaseQuoteCost;
  projectSubtotalWithDiscountsPromotionsAndSwellGridrewards: IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards;
  totalPromotionsDiscountsAndSwellGridrewards: ITotalPromotionsDiscountsAndSwellGridrewards;
  salesOriginationManagerFee: IBaseCostBuildupFee;
  salesOriginationSalesFee: IBaseCostBuildupFee;
  thirdPartyFinancingDealerFee: IBaseCostBuildupFee;
  cashDiscount: ICashDiscount;
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

export interface ICreateQuoteCostBuildupParams {
  roofTopDesignData: ICreateQuoteCostBuildUpArg;
  partnerMarkup: LeanDocument<QuotePartnerConfig>;
  financialProduct: LeanDocument<FinancialProduct>;
  userInputs?: QuoteCostBuildupUserInputDto;
  dealerFeePercentage: number;
}
