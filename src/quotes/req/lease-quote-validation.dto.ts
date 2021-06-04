import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsMongoId, IsNumber, IsOptional, ValidateNested } from 'class-validator';

class IUtilityProgramDto {
  @ApiProperty()
  @IsMongoId()
  @IsOptional()
  utilityProgramId?: string;

  @ApiProperty()
  @IsOptional()
  utilityProgramName: string;
}

class ILeaseProductAttributesDto {
  @ApiProperty()
  @IsNumber()
  leaseTerm: number;

  @ApiProperty()
  @IsNumber()
  rateEscalator: number;
}

class IFinancialProductDto {
  @ApiProperty({ type: ILeaseProductAttributesDto })
  @ValidateNested()
  @Type(() => ILeaseProductAttributesDto)
  productAttribute: ILeaseProductAttributesDto;
}

class IQuoteFinanceProductDto {
  @ApiProperty({ type: IFinancialProductDto })
  @ValidateNested()
  @Type(() => IFinancialProductDto)
  financeProduct: IFinancialProductDto;
}

class IStorageQuoteDetailSnapshotDto {
  @ApiProperty()
  @IsNumber()
  sizekWh: number;
}
class IStorageQuoteDetailsDto {
  @ApiProperty({ type: IStorageQuoteDetailSnapshotDto })
  @ValidateNested()
  @Type(() => IStorageQuoteDetailSnapshotDto)
  storageModelDataSnapshot: IStorageQuoteDetailSnapshotDto;
}

class IQuoteCostBuildUpDto {
  @ApiProperty({ type: [IStorageQuoteDetailsDto] })
  @Type(() => IStorageQuoteDetailsDto)
  @ValidateNested({ each: true })
  storageQuoteDetails: IStorageQuoteDetailsDto[];
}

class ISystemProductionDto {
  @ApiProperty()
  @IsNumber()
  capacityKW: number;

  @ApiProperty()
  @IsNumber()
  productivity: number;
}

export class LeaseQuoteValidationDto {
  @ApiProperty()
  @IsBoolean()
  isSolar: boolean;

  @ApiProperty()
  @IsBoolean()
  isRetrofit: boolean;

  @ApiProperty({ type: IUtilityProgramDto })
  @ValidateNested()
  @Type(() => IUtilityProgramDto)
  utilityProgram: IUtilityProgramDto;

  @ApiProperty({ type: IQuoteFinanceProductDto })
  @ValidateNested()
  @Type(() => IQuoteFinanceProductDto)
  quoteFinanceProduct: IQuoteFinanceProductDto;

  @ApiProperty({ type: ISystemProductionDto })
  @ValidateNested()
  @Type(() => ISystemProductionDto)
  systemProduction: ISystemProductionDto;

  @ApiProperty({ type: IQuoteCostBuildUpDto })
  @ValidateNested()
  @Type(() => IQuoteCostBuildUpDto)
  quoteCostBuildup: IQuoteCostBuildUpDto;
}
