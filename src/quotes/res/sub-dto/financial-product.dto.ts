import { ILoanTerms } from 'src/financial-products/financial-product.schema';
import { Default, ExposeMongoId, ExposeObjectId, ExposeProp } from 'src/shared/decorators';

export class LoanTermsDto implements ILoanTerms {
  @ExposeProp()
  months: number;

  @ExposeProp()
  paymentFactor: number;
}

export class FinanceProductDetailDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  fundingSourceId: string;

  @ExposeObjectId({ fieldName: 'financierId' })
  financierId: string;

  @ExposeProp()
  isActive: boolean;

  @ExposeProp()
  name: string;

  @ExposeProp()
  fundId: string;

  @ExposeProp()
  fundProductScoreCard: string;

  @ExposeProp()
  financialSolverId: string[];

  @ExposeProp()
  fmvAppraisalId: string;

  @ExposeProp()
  nonAchFee: number;

  @ExposeProp()
  lateFee: number;

  @ExposeProp()
  defaultTurnkeyPriceEsPv: number;

  @ExposeProp()
  earlyPurchaseDiscountOption: number;

  @ExposeProp()
  maxInstallationAmount: number;

  @ExposeProp()
  repaymentMethod: string[];

  @ExposeProp()
  allowDownPayment: boolean;

  @ExposeProp()
  minDownPayment: number;

  @ExposeProp()
  defaultDownPayment: number;

  @ExposeProp()
  maxDownPayment: number;

  @ExposeProp()
  maxDownPaymentPercentage: number;

  @ExposeProp()
  annualDegradation: number;

  @ExposeProp()
  guaranteedProduction: number;

  @ExposeProp()
  minMargin: number;

  @ExposeProp()
  maxMargin: number;

  @ExposeProp()
  minSystemKw: number;

  @ExposeProp()
  maxSystemKw: number;

  @ExposeProp()
  minBatteryKwh: number;

  @ExposeProp()
  maxBatteryKwh: number;

  @ExposeProp()
  minProductivity: number;

  @ExposeProp()
  maxProductivity: number;

  @ExposeProp({ type: String, isArray: true })
  allowedStates: string[];

  @ExposeProp()
  @Default()
  interestRate: number;

  @ExposeProp({ type: LoanTermsDto, isArray: true })
  terms: LoanTermsDto[];

  @ExposeProp()
  termMonths: number;

  @ExposeProp()
  dealerFee: number;

  @ExposeProp()
  minBatteryReserve: number;

  @ExposeProp()
  maxBatteryReserve: number;

  @ExposeProp()
  minClippingRatio: number;

  @ExposeProp()
  maxClippingRatio: number;

  @ExposeProp()
  minMarkup: number;

  @ExposeProp()
  maxMarkup: number;

  @ExposeProp()
  requiresHardCreditApproval: boolean;

  @ExposeProp()
  requiresSoftCreditApproval: boolean;

  @ExposeProp()
  countersignerName: string;

  @ExposeProp()
  countersignerTitle: string;

  @ExposeProp()
  countersignerEmail: string;

  @ExposeProp()
  allowsWetSignedContracts: boolean;

  @ExposeProp()
  projectCompletionDateOffset: number;

  @ExposeProp()
  processingFee: number;

  @ExposeProp()
  payment1: number;

  @ExposeProp()
  payment1PayPercent: boolean;

  @ExposeProp()
  proposalValidityPeriod: number;
}
