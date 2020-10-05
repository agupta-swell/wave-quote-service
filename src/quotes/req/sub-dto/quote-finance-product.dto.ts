import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { CashProductAttributesDto, LeaseProductAttributesDto, LoanProductAttributesDto } from '.';

export class IncentiveDetailsDto {
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
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appliesTo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
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
export class FinaceProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fundingSourceId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
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
  incentiveDetails: IncentiveDetailsDto[];

  @ApiProperty({ type: RebateDetailsDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RebateDetailsDto)
  rebateDetails: RebateDetailsDto[];

  @ApiProperty({ type: FinaceProductDto })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FinaceProductDto)
  finaceProduct: FinaceProductDto;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  netAmount: number;

  @ApiProperty({ type: ProjectDiscountDetailDto, isArray: true })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProjectDiscountDetailDto)
  projectDiscountDetail: ProjectDiscountDetailDto[];
}
