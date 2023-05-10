import { Document, LeanDocument } from 'mongoose';
import { IDiscount } from 'src/discounts/interfaces';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IPromotion } from 'src/promotions/interfaces';
import { QuotePartnerConfig } from 'src/quote-partner-configs/quote-partner-config.schema';
import { IIncentiveDetailsSchema } from 'src/quotes/quote.schema';
import { QuoteCostBuildupUserInputDto } from 'src/quotes/res/sub-dto';
import { IBaseQuoteCost } from './IBaseQuoteCost';
import { IBaseQuoteMarginData } from './IBaseQuoteMarginData';
import { IAdditionalFees, IBaseCostBuildupFee, ICashDiscount, ISalesOriginationSalesFee } from './ICostBuildupFee';
import { ICreateQuoteCostBuildUpArg } from './ICreateQuoteCostBuildUpArg';
import { IQuoteCost } from './IQuoteCost';
import { ISalesTaxData } from './ISalesTaxData';
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
  equipmentSubtotal: IBaseQuoteCost;
  equipmentAndLaborSubtotal: IBaseQuoteCost;
  equipmentLaborAndAddersSubtotal: IBaseQuoteCost;
  projectGrossTotal: IBaseQuoteCost;
  projectSubtotalWithDiscountsPromotionsAndSwellGridrewards: IBaseQuoteMarginData;
  totalPromotionsDiscountsAndSwellGridrewards: ITotalPromotionsDiscountsAndSwellGridrewards;
  salesOriginationManagerFee: IBaseCostBuildupFee;
  salesOriginationSalesFee: ISalesOriginationSalesFee;
  thirdPartyFinancingDealerFee: IBaseCostBuildupFee;
  cashDiscount: ICashDiscount | null; // This field is only used for backwards compatibility
  subtotalWithSalesOriginationManagerFee: IBaseQuoteMarginData;
  additionalFees: IAdditionalFees;
  projectGrandTotal: IBaseQuoteMarginData;
  taxableEquipmentSubtotal: IBaseQuoteCost;
  salesTax: ISalesTaxData;
  equipmentSubtotalWithSalesTax: IBaseQuoteCost;
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
  userInputs?: QuoteCostBuildupUserInputDto;
  dealerFeePercentage: number;
  discountsPromotionsAndIncentives?: {
    discounts?: IDiscount[];
    promotions?: IPromotion[];
    incentives?: IIncentiveDetailsSchema[];
  };
}
