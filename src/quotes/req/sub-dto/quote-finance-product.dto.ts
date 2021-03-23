import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { GsProgramsDto } from 'src/gs-programs/res/gs-programs.dto';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';
import { FINANCE_PRODUCT_TYPE, REBATE_TYPE } from '../../constants';

export class SgipDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  gsTermYears: string;

  @ApiProperty({ type: GsProgramsDto })
  @IsNotEmpty()
  @Type(() => GsProgramsDto)
  gsProgramSnapshot: GsProgramsDto;
}

export class IncentiveDetailsDto {
  @ApiProperty({ enum: REBATE_TYPE })
  @IsNotEmpty()
  @IsString()
  type: REBATE_TYPE;

  @ApiProperty({ type: SgipDetailsDto })
  @IsNotEmpty()
  @IsString()
  detail: SgipDetailsDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}

export class RebateDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

@ApiExtraModels(LoanProductAttributesDto, CashProductAttributesDto, LeaseProductAttributesDto)
export class FinanceProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productType: FINANCE_PRODUCT_TYPE;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fundingSourceId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
  @IsNotEmpty()
  productAttribute: LoanProductAttributesDto | CashProductAttributesDto | LeaseProductAttributesDto;
}

export class ProjectDiscountDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unitValue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appliesTo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}

export class QuoteFinanceProductDto {
  @ApiProperty({ type: IncentiveDetailsDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IncentiveDetailsDto)
  incentiveDetails: IncentiveDetailsDto;

  @ApiProperty({ type: RebateDetailsDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RebateDetailsDto)
  rebateDetails: RebateDetailsDto[];

  @ApiProperty({ type: FinanceProductDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FinanceProductDto)
  financeProduct: FinanceProductDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  netAmount: number;

  @ApiProperty({ type: ProjectDiscountDetailDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProjectDiscountDetailDto)
  projectDiscountDetails: ProjectDiscountDetailDto[];
}
