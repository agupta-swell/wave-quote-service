import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DISCOUNT_TYPE } from 'src/discounts/discount.constant';
import { GsProgramsDto } from 'src/gs-programs/res/gs-programs.dto';
import { PROMOTION_TYPE } from 'src/promotions/promotion.constant';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';
import { FINANCE_PRODUCT_TYPE, REBATE_TYPE } from '../../constants';
import { FinanceProductDetailDto } from './financial-product.dto';

export class GridServiceDetailsDto {
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
  @IsEnum(REBATE_TYPE)
  type: REBATE_TYPE;

  @ApiProperty({ type: GridServiceDetailsDto })
  @IsNotEmpty()
  detail: GridServiceDetailsDto;

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
  @IsEnum(REBATE_TYPE)
  type: REBATE_TYPE;

  @ApiProperty()
  description: string;

  @ApiProperty()
  @IsBoolean()
  isFloatRebate: boolean;
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

  @ApiProperty({ type: FinanceProductDetailDto })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => FinanceProductDetailDto)
  financialProductSnapshot: FinanceProductDetailDto;
}

export class PromotionDiscountDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  type: PROMOTION_TYPE;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  cogsAllocation: number;

  @ApiProperty()
  cogsAmount: number;

  @ApiProperty()
  marginAllocation: number;

  @ApiProperty()
  marginAmount: number;
}

export class ProjectDiscountDetailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @ValidateIf((o: ProjectDiscountDetailDto) => o.id === 'managerDiscount')
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsEnum(DISCOUNT_TYPE)
  @ValidateIf((o: ProjectDiscountDetailDto) => o.id === 'managerDiscount')
  type: DISCOUNT_TYPE;

  @ApiProperty()
  @IsOptional()
  startDate: Date;

  @ApiProperty()
  @IsOptional()
  endDate: Date;

  @ApiProperty()
  @IsOptional()
  cogsAllocation: number;

  @ApiProperty()
  @IsOptional()
  cogsAmount: number;

  @ApiProperty()
  @IsOptional()
  marginAllocation: number;

  @ApiProperty()
  @IsOptional()
  marginAmount: number;
}

export class QuoteFinanceProductDto {
  @ApiProperty({ type: IncentiveDetailsDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IncentiveDetailsDto)
  incentiveDetails: IncentiveDetailsDto[];

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
  @ValidateNested({ each: true })
  @Type(() => ProjectDiscountDetailDto)
  @ValidateIf((_, val: ProjectDiscountDetailDto | undefined) => !!val && Array.isArray(val) && val.length > 0)
  @ArrayUnique<ProjectDiscountDetailDto>(discount => discount.id)
  projectDiscountDetails: ProjectDiscountDetailDto[];

  @ApiProperty({ type: PromotionDiscountDetailDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => PromotionDiscountDetailDto)
  @ValidateIf((_, val: ProjectDiscountDetailDto | undefined) => !!val && Array.isArray(val) && val.length > 0)
  @ArrayUnique<PromotionDiscountDetailDto>(promotion => promotion.id)
  promotionDetails: PromotionDiscountDetailDto[];
}
