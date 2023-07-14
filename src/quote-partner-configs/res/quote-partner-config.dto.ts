import { ExposeMongoId, ExposeProp, ExposeObjectId } from 'src/shared/decorators';
import { ServiceResponse } from '../../app/common/service-response';

export class QuotePartnerConfigDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp()
  partnerId: string;

  @ExposeProp()
  enableCostBuildup: boolean;

  @ExposeProp()
  enablePricePerWatt: boolean;

  @ExposeProp()
  enablePriceOverride: boolean;

  @ExposeProp()
  generalMarkup: number;

  @ExposeProp({ default: [] })
  enabledFinancialProducts: string[];

  @ExposeProp()
  solarMarkup: number;

  @ExposeProp()
  storageMarkup: number;

  @ExposeProp()
  inverterMarkup: number;

  @ExposeProp()
  ancillaryEquipmentMarkup: number;

  @ExposeProp()
  softCostMarkup: number;

  @ExposeProp()
  bosMarkup: number;

  @ExposeProp()
  laborMarkup: number;

  @ExposeProp()
  salesOriginationManagerFee: number;

  @ExposeProp()
  salesOriginationSalesFee: number;

  @ExposeProp()
  useFixedSalesOriginationSalesFee: boolean;

  @ExposeObjectId({ fieldName: 'defaultInverterId' })
  defaultInverterId: string;

  @ExposeProp()
  proposalValidityPeriod: string;
}

export class QuotePartnerConfigResponse implements ServiceResponse<QuotePartnerConfigDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QuotePartnerConfigDto })
  data: QuotePartnerConfigDto;
}
