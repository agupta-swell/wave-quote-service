import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { DiscountResDto } from 'src/discounts/dto';
import { GsProgramsDto } from 'src/gs-programs/res/gs-programs.dto';
import { PromotionResDto } from 'src/promotions/dto';
import { ExposeAndMap, ExposeProp } from 'src/shared/decorators';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';
import { FinanceProductDetailDto } from './financial-product.dto';

export class GridServiceDetailsDto {
  @ExposeProp()
  gsTermYears: string;

  @ExposeProp({ type: GsProgramsDto })
  gsProgramSnapshot: GsProgramsDto;
}
export class IncentiveDetailsDto {
  @ExposeProp()
  type: string;

  @ExposeProp({ type: GridServiceDetailsDto })
  detail: GridServiceDetailsDto;

  @ExposeProp()
  amount: number;

  @ExposeProp()
  appliesTo: string;

  @ExposeAndMap({}, ({ obj }) => obj.appliesTo)
  applies_to: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  unit: string;

  @ExposeProp()
  unitValue: string;

  @ExposeAndMap({}, ({ obj }) => obj.unitValue)
  unit_value: string;

  @ExposeProp()
  cogsAllocation: number;

  @ExposeProp()
  cogsAmount: number;

  @ExposeProp()
  marginAllocation: number;

  @ExposeProp()
  marginAmount: number;
}

export class RebateDetailsDto {
  @ExposeProp()
  amount: number;

  @ExposeProp()
  type: string;

  @ExposeProp()
  description: string;

  @ExposeProp()
  isFloatRebate: string;

  @ExposeProp()
  cogsAllocation: number;

  @ExposeProp()
  cogsAmount: number;

  @ExposeProp()
  marginAllocation: number;

  @ExposeProp()
  marginAmount: number;
}

@ApiExtraModels(LoanProductAttributesDto, CashProductAttributesDto, LeaseProductAttributesDto)
export class FinanceProductDto {
  @ExposeProp()
  productType: string;

  @ExposeProp()
  fundingSourceId: string;

  @ExposeProp()
  fundingSourceName: string;
  // FIXME: need to implement later

  @ExposeProp({
    type: Object,
    oneOf: [
      { $ref: getSchemaPath(LoanProductAttributesDto) },
      { $ref: getSchemaPath(CashProductAttributesDto) },
      { $ref: getSchemaPath(LeaseProductAttributesDto) },
    ],
    default: {},
    skipTransform: true,
  })
  productAttribute: LoanProductAttributesDto | CashProductAttributesDto | LeaseProductAttributesDto;

  @ExposeProp()
  netAmount: number;

  @ExposeProp({ type: FinanceProductDetailDto })
  financialProductSnapshot: FinanceProductDetailDto;
}

export class QuoteFinanceProductDto {
  @ExposeProp({ type: IncentiveDetailsDto, isArray: true })
  incentiveDetails: IncentiveDetailsDto[];

  @ExposeProp({ type: RebateDetailsDto, isArray: true })
  rebateDetails: RebateDetailsDto[];

  @ExposeProp({ type: FinanceProductDto })
  financeProduct: FinanceProductDto;

  @ExposeProp()
  netAmount: number;

  @ExposeProp({ type: DiscountResDto, isArray: true })
  projectDiscountDetails: DiscountResDto[];

  @ExposeProp({ type: PromotionResDto, isArray: true })
  promotionDetails: PromotionResDto[];
}
