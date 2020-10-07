import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from './../../../products/res/product.dto';

class DiscountDetailDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  description: string;
}

class QuoteCostBuildupCommon {
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  cost: number;

  @ApiProperty()
  markup: number;

  @ApiProperty()
  netCost: number;

  @ApiProperty({ type: () => DiscountDetailDto, isArray: true })
  discountDetails: DiscountDetailDto[];
}

class PanelQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: ProductDto })
  panelModelDataSnapshot: ProductDto;

  @ApiProperty()
  panelModelSnapshotDate: Date;
}

class InverterQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: ProductDto })
  inverterModelDataSnapshot: ProductDto;

  @ApiProperty()
  inverterModelSnapshotDate: Date;
}

class StorageQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: ProductDto })
  storageModelDataSnapshot: ProductDto;

  @ApiProperty()
  storageModelSnapshotDate: Date;
}

class AdderQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: ProductDto })
  adderModelDataSnapshot: ProductDto;

  @ApiProperty()
  adderModelSnapshotDate: Date;
}

class LaborCostDto extends QuoteCostBuildupCommon {
  @ApiProperty()
  laborCostDataSnapshot: { calculationType: string; unit: string };

  @ApiProperty()
  laborCostSnapshotDate: Date;
}

export class QuoteCostBuildupDto {
  @ApiProperty({ type: () => PanelQuoteDetailsDto, isArray: true })
  panelQuoteDetails: PanelQuoteDetailsDto[];

  @ApiProperty({ type: () => InverterQuoteDetailsDto, isArray: true })
  inverterQuoteDetails: InverterQuoteDetailsDto[];

  @ApiProperty({ type: () => StorageQuoteDetailsDto, isArray: true })
  storageQuoteDetails: StorageQuoteDetailsDto[];

  @ApiProperty({ type: () => AdderQuoteDetailsDto, isArray: true })
  adderQuoteDetails: AdderQuoteDetailsDto[];

  @ApiProperty()
  overallMarkup: number;

  @ApiProperty()
  totalProductCost: number;

  @ApiProperty({ type: LaborCostDto })
  laborCost: LaborCostDto;

  @ApiProperty()
  grossAmount: number;
}
