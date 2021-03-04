import { ApiProperty } from '@nestjs/swagger';

class RecommendationDetailDataDto {
  @ApiProperty()
  requiredInverterCapacityForDefaultRatio: number;

  @ApiProperty()
  maxClippedWattForDefaultRatio: number;

  @ApiProperty()
  requiredInverterCapacityForMaxDefaultRatio: number;

  @ApiProperty()
  maxClippedWattForMaxRatio: number;

  @ApiProperty()
  recommendedInverterCountForDefaultRatio: number;

  @ApiProperty()
  recommendedInverterCountForDefaultRatioBasedOnRating: number;
}

export class ClippingDetailsDto {
  @ApiProperty()
  isDCClippingRestrictionEnabled?: boolean;

  @ApiProperty()
  defaultClippingRatio?: number;

  @ApiProperty()
  maximumAllowedClippingRatio?: number;

  @ApiProperty()
  totalSTCProductionInWatt?: number;

  @ApiProperty()
  totalInverterCapacityInWatt?: number;

  @ApiProperty()
  currentClippingRatio?: number;

  @ApiProperty()
  isDcToAcRatioWithinAllowedLimit?: boolean;

  @ApiProperty({ type: RecommendationDetailDataDto })
  recommendationDetail: RecommendationDetailDataDto;

  constructor(props: ClippingDetailsDto) {
    this.currentClippingRatio = props.currentClippingRatio;
    this.defaultClippingRatio = props.defaultClippingRatio;
    this.maximumAllowedClippingRatio = props.maximumAllowedClippingRatio;
    this.totalSTCProductionInWatt = props.totalSTCProductionInWatt;
    this.totalInverterCapacityInWatt = props.totalInverterCapacityInWatt;
    this.currentClippingRatio = props.currentClippingRatio;
    this.isDcToAcRatioWithinAllowedLimit = props.isDcToAcRatioWithinAllowedLimit;
    this.recommendationDetail = props.recommendationDetail || ({} as any);
  }
}
