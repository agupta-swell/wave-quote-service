import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';
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

  //! will remove start
  @ExposeProp()
  enableModuleDCClipping: boolean;

  @ExposeProp()
  pricePerWatt: number;

  @ExposeProp()
  defaultDCClipping: number;

  @ExposeProp()
  maxModuleDCClipping: number;

  @ExposeProp()
  solarOnlyLaborFeePerWatt: number;

  @ExposeProp()
  storageRetrofitLaborFeePerProject: number;

  @ExposeProp()
  solarWithACStorageLaborFeePerProject: number;

  @ExposeProp()
  solarWithDCStorageLaborFeePerProject: number;

  @ExposeProp()
  swellStandardMarkup: number;
  //! will remove end

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
}

export class QuotePartnerConfigResponse implements ServiceResponse<QuotePartnerConfigDto> {
  @ExposeProp()
  status: string;

  @ExposeProp({ type: QuotePartnerConfigDto })
  data: QuotePartnerConfigDto;
}
