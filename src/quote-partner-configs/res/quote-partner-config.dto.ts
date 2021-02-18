import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponse } from '../../app/common/service-response';
import { V2QuotePartnerConfig } from '../quote-partner-config.schema';

export class V2QuotePartnerConfigDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty()
  enableCostBuildup: boolean;

  @ApiProperty()
  enablePricePerWatt: boolean;

  @ApiProperty()
  enablePriceOverrideMode: boolean;

  @ApiProperty()
  pricePerWatt: number;

  @ApiProperty()
  defaultDCClipping: number;

  @ApiProperty()
  maxModuleDCClipping: number;

  @ApiProperty()
  solarOnlyLaborFeePerWatt: number;

  @ApiProperty()
  storageRetrofitLaborFeePerProject: number;

  @ApiProperty()
  solarWithACStorageLaborFeePerProject: number;

  @ApiProperty()
  solarWithDCStorageLaborFeePerProject: number;

  @ApiProperty()
  swellStandardMarkup: number;

  constructor(props: V2QuotePartnerConfig) {
    this.id = props.id;
    this.partnerId = props.partnerId;
    this.enableCostBuildup = props.enableCostBuildup;
    this.enablePricePerWatt = props.enablePricePerWatt;
    this.enablePriceOverrideMode = props.enablePriceOverrideMode;
    this.pricePerWatt = props.pricePerWatt;
    this.defaultDCClipping = props.defaultDCClipping;
    this.maxModuleDCClipping = props.maxModuleDCClipping;
    this.solarOnlyLaborFeePerWatt = props.solarOnlyLaborFeePerWatt;
    this.storageRetrofitLaborFeePerProject = props.storageRetrofitLaborFeePerProject;
    this.solarWithACStorageLaborFeePerProject = props.solarWithACStorageLaborFeePerProject;
    this.solarWithDCStorageLaborFeePerProject = props.solarWithDCStorageLaborFeePerProject;
    this.swellStandardMarkup = props.swellStandardMarkup;
  }
}

export class V2QuotePartnerConfigResponse implements ServiceResponse<V2QuotePartnerConfigDto> {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: V2QuotePartnerConfigDto })
  data: V2QuotePartnerConfigDto;
}
