import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { GsProgramsDto } from 'src/gs-programs/res/gs-programs.dto';
import { REBATE_TYPE } from 'src/quotes/constants';
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
  @ExposeProp({ enum: REBATE_TYPE })
  type: REBATE_TYPE;

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

export class ProjectDiscountDetailDto {
  @ExposeAndMap({}, ({ obj }) => obj.id || obj._id || obj.discountId)
  id: string;

  @ExposeProp()
  discountId: string;

  @ExposeProp()
  name: string;

  @ExposeProp()
  amount: number;

  @ExposeProp()
  type: string;

  @ExposeProp()
  startDate: Date;

  @ExposeProp()
  endDate: Date;

  @ExposeProp()
  description: string;

  @ExposeProp()
  excludeAdders: boolean;

  @ExposeProp()
  unit: string;

  @ExposeProp()
  unitValue: number;
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

  @ExposeProp({ type: ProjectDiscountDetailDto, isArray: true })
  projectDiscountDetails: ProjectDiscountDetailDto[];
}
