import { ApiProperty } from '@nestjs/swagger';
import { ExposeProp } from 'src/shared/decorators';

class RecommendationDetailDataDto {
  @ExposeProp()
  requiredInverterCapacityForDefaultRatio: number;

  @ExposeProp()
  maxClippedWattForDefaultRatio: number;

  @ExposeProp()
  requiredInverterCapacityForMaxDefaultRatio: number;

  @ExposeProp()
  maxClippedWattForMaxRatio: number;

  @ExposeProp()
  recommendedInverterCountForDefaultRatio: number;

  @ExposeProp()
  recommendedInverterCountForDefaultRatioBasedOnRating: number;
}

export class ClippingDetailsDto {
  @ExposeProp()
  isDCClippingRestrictionEnabled?: boolean;

  @ExposeProp()
  defaultClippingRatio?: number;

  @ExposeProp()
  maximumAllowedClippingRatio?: number;

  @ExposeProp()
  totalSTCProductionInWatt?: number;

  @ExposeProp()
  totalInverterCapacityInWatt?: number;

  @ExposeProp()
  currentClippingRatio?: number;

  @ExposeProp()
  isDcToAcRatioWithinAllowedLimit?: boolean;

  @ExposeProp({ type: RecommendationDetailDataDto })
  recommendationDetail: RecommendationDetailDataDto;
}
