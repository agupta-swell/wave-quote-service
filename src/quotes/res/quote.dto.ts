import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { SystemProductionDto } from 'src/system-productions/res';
import { TaxCreditConfigResDto } from 'src/tax-credit-configs/dto';
import { Pagination, ServiceResponse } from '../../app/common';
import { NotesDto, QuoteCostBuildupDto, QuoteFinanceProductDto } from './sub-dto';

class UtilityProgramDataSnapshotDto {
  @ExposeProp()
  utilityProgramName: string;

  @ExposeProp()
  programManagerId?: string;

  @ExposeProp()
  gsaDisplayName: string;

  @ExposeProp()
  isActive: boolean;

  @ExposeProp()
  endDate: string;
}
class UtilityProgramDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  rebateAmount: number;

  @ExposeProp({ type: UtilityProgramDataSnapshotDto })
  utilityProgramDataSnapshot: UtilityProgramDataSnapshotDto;

  @ExposeProp()
  utilityProgramDataSnapshotDate: Date;

  @ExposeProp()
  utilityProgramId: string;

  @ExposeProp()
  utilityProgramName: string;
}

class RebateProgramDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  name: string;
}

class SavingsDetailDto {
  @ExposeProp()
  year: number;

  @ExposeProp()
  currentUtilityBill: number;

  @ExposeProp()
  newUtilityBill: number;

  @ExposeProp()
  payment: number;

  @ExposeProp()
  discountAndIncentives: number;

  @ExposeProp()
  annualSaving: number;
}

class TaxCreditConfigSnapshot {
  @ExposeProp()
  name: string;

  @ExposeProp()
  taxCreditPrecentage: number;

  @ExposeProp()
  taxCreditStartDate: Date;

  @ExposeProp()
  taxCreditEndDate: Date;
}

class TaxCreditDto {
  @ExposeProp()
  name: string;

  @ExposeProp()
  percentage: number;

  @ExposeProp()
  value: number;

  @ExposeProp({ type: TaxCreditConfigResDto })
  taxCreditConfigDataSnapshot: TaxCreditConfigResDto;

  @ExposeProp()
  taxCreditConfigDataSnapshotDate: Date;

  @ExposeAndMap({}, ({ obj }) => obj.taxCreditConfigDataId)
  taxCreditConfigDataId: string;
}

class QuotePricePerWatt {
  @ExposeProp()
  pricePerWatt: number;

  @ExposeProp()
  grossPrice: number;
}

class QuotePriceOverride {
  @ExposeProp()
  grossPrice: number;
}

export class QuoteDto {
  @ExposeMongoId()
  quoteId: string;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  quoteName: string;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  isRetrofit: boolean;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  isSolar: boolean;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  isSelected: boolean;

  @ExposeProp()
  opportunityId: string;

  @ExposeProp()
  systemDesignId: string;

  @ExposeAndMap({ type: SystemProductionDto, root: 'detailedQuote', checkParent: true })
  systemProduction: SystemProductionDto;

  @ExposeAndMap({ type: QuoteCostBuildupDto, root: 'detailedQuote', checkParent: true })
  quoteCostBuildup: QuoteCostBuildupDto;

  @ExposeAndMap({ type: UtilityProgramDto, root: 'detailedQuote', checkParent: true })
  utilityProgram: UtilityProgramDto;

  @ExposeAndMap({ type: RebateProgramDto, root: 'detailedQuote', checkParent: true })
  rebateProgram: RebateProgramDto;

  @ExposeAndMap({ type: QuoteFinanceProductDto, root: 'detailedQuote', checkParent: true })
  quoteFinanceProduct: QuoteFinanceProductDto;

  @ExposeAndMap({ type: SavingsDetailDto, isArray: true, root: 'detailedQuote', checkParent: true })
  savingsDetails: SavingsDetailDto[];

  @ExposeProp()
  isArchived: boolean;

  @ExposeProp()
  isSync: boolean;

  @ExposeProp()
  isSyncMessages: string[];

  @ExposeProp()
  solverId: string;

  @ExposeAndMap({ type: TaxCreditDto, isArray: true, root: 'detailedQuote', checkParent: true })
  taxCreditData: TaxCreditDto[];

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  utilityProgramSelectedForReinvestment: boolean;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  taxCreditSelectedForReinvestment: boolean;

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true, isArray: true })
  allowedQuoteModes: string[];

  @ExposeAndMap({ root: 'detailedQuote', checkParent: true })
  selectedQuoteMode: string;

  @ExposeAndMap({ type: QuotePricePerWatt, root: 'detailedQuote', checkParent: true })
  quotePricePerWatt: QuotePricePerWatt;

  @ExposeAndMap({ type: QuotePriceOverride, root: 'detailedQuote', checkParent: true })
  quotePriceOverride: QuotePriceOverride;

  @ExposeAndMap({ type: NotesDto, isArray: true }, ({ obj }) => obj.detailedQuote?.notes ?? [])
  notes: NotesDto[];

  @ExposeAndMap({}, ({ obj }) => obj?.itcRate?.itcRate)
  itc_rate?: number;

  @ExposeProp({ default: true, skipTransform: true })
  editable: boolean;

  @ExposeProp()
  editableMessage?: string;

  @ExposeProp()
  primaryQuoteType?: string;
}

class PaginationRes implements Pagination<QuoteDto> {
  @ExposeProp({
    type: QuoteDto,
    isArray: true,
  })
  data: QuoteDto[];

  @ExposeProp()
  total: number;
}

export class QuoteListRes implements ServiceResponse<PaginationRes> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: PaginationRes })
  data: PaginationRes;
}

export class QuoteRes implements ServiceResponse<QuoteDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QuoteDto })
  data: QuoteDto;
}
