import { Pagination, ServiceResponse } from 'src/app/common';
import { FmvAppraisalDto } from 'src/fmvAppraisal/res/fmv-appraisal.dto';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class FinancialProductDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  fundingSourceId: string;

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

  @ExposeProp({ type: FmvAppraisalDto })
  fmvAppraisal: FmvAppraisalDto;

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

  @ExposeProp()
  allowedStates: string[];

  @ExposeProp()
  termMonths: number;

  @ExposeProp()
  dealerFee: number;

  @ExposeProp()
  financierId?: string;

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
  proposalValidityPeriod: number;
}

class FinancialProductPaginationDto implements Pagination<FinancialProductDto> {
  @ExposeProp({
    type: FinancialProductDto,
    isArray: true,
  })
  data: FinancialProductDto[];

  @ExposeProp()
  total: number;
}

export class FinancialProductPaginationRes implements ServiceResponse<FinancialProductPaginationDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: FinancialProductPaginationDto })
  data: FinancialProductPaginationDto;
}
