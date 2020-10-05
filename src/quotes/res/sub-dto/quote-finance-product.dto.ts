import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';

export class IncentiveDetailsDto {
  @ApiProperty()
  unit: string;

  @ApiProperty()
  unitValue: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  appliesTo: string;

  @ApiProperty()
  description: string;
}

export class RebateDetailsDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: string;

  @ApiProperty()
  description: string;
}

@ApiExtraModels(LoanProductAttributesDto, CashProductAttributesDto, LeaseProductAttributesDto)
export class FinaceProductDto {
  @ApiProperty()
  productType: string;

  @ApiProperty()
  fundingSourceId: string;

  @ApiProperty()
  fundingSourceName: string;
  //FIXME: need to implement later

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
}

export class ProjectDiscountDetailDto {
  @ApiProperty()
  unit: string;

  @ApiProperty()
  unitValue: number;

  @ApiProperty()
  appliesTo: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  excludeAdders: boolean;
}

export class QuoteFinanceProductDto {
  @ApiProperty({ type: IncentiveDetailsDto, isArray: true })
  incentiveDetails: IncentiveDetailsDto[];

  @ApiProperty({ type: RebateDetailsDto, isArray: true })
  rebateDetails: RebateDetailsDto[];

  @ApiProperty({ type: FinaceProductDto })
  finaceProduct: FinaceProductDto;

  @ApiProperty()
  netAmount: number;

  @ApiProperty({ type: ProjectDiscountDetailDto, isArray: true })
  projectDiscountDetails: ProjectDiscountDetailDto[];
}
