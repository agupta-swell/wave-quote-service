import { Type } from 'class-transformer';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { GsProgramsDto } from 'src/gs-programs/res/gs-programs.dto';
import { REBATE_TYPE } from 'src/quotes/constants';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';
import { FinanceProductDetailDto } from './financial-product.dto';

export class GridServiceDetailsDto {
  @ApiProperty()
  gsTermYears: string;

  @ApiProperty()
  gsProgramSnapshot: GsProgramsDto;
}
export class IncentiveDetailsDto {
  @ApiProperty({ enum: REBATE_TYPE })
  type: REBATE_TYPE;

  @ApiProperty()
  detail: GridServiceDetailsDto;

  @ApiProperty()
  amount: number;
}

export class RebateDetailsDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isFloatRebate: string;
}

@ApiExtraModels(LoanProductAttributesDto, CashProductAttributesDto, LeaseProductAttributesDto)
export class FinanceProductDto {
  @ApiProperty()
  productType: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  fundingSourceName: string;
  // FIXME: need to implement later

  @ApiProperty({
    type: () => Object,
    oneOf: [
      { $ref: getSchemaPath(LoanProductAttributesDto) },
      { $ref: getSchemaPath(CashProductAttributesDto) },
      { $ref: getSchemaPath(LeaseProductAttributesDto) },
    ],
    default: {},
  })
  productAttribute: LoanProductAttributesDto | CashProductAttributesDto | LeaseProductAttributesDto;

  @ApiProperty()
  netAmount: number;

  @ApiProperty({ type: FinanceProductDetailDto })
  financialProductSnapshot: FinanceProductDetailDto;
}

export class ProjectDiscountDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;
}

export class QuoteFinanceProductDto {
  @ApiProperty({ type: IncentiveDetailsDto, isArray: true })
  incentiveDetails: IncentiveDetailsDto[];

  @ApiProperty({ type: RebateDetailsDto, isArray: true })
  rebateDetails: RebateDetailsDto[];

  @ApiProperty({ type: FinanceProductDto })
  financeProduct: FinanceProductDto;

  @ApiProperty()
  netAmount: number;

  @ApiProperty({ type: ProjectDiscountDetailDto, isArray: true })
  projectDiscountDetails: ProjectDiscountDetailDto[];
}
