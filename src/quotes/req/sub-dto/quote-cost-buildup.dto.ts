import { ApiProperty } from '@nestjs/swagger';
import { ProductDto } from 'src/products/res/product.dto';
import { AncillaryEquipmentDto } from 'src/system-designs/res/sub-dto';

class QuoteCostBuildupCommon {
  @ApiProperty()
  quantity: number;

  @ApiProperty()
  cost: number;

  @ApiProperty()
  subcontractorMarkup: number;

  @ApiProperty()
  netCost: number;
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

  @ApiProperty()
  unit: string;
}

class BosDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: ProductDto })
  bosModelDataSnapshot: ProductDto;

  @ApiProperty()
  bosModelSnapshotDate: Date;

  @ApiProperty()
  unit: string;
}

class AncillaryDetailsDto extends QuoteCostBuildupCommon {
  @ApiProperty({ type: AncillaryEquipmentDto })
  ancillaryEquipmentSnapshot: AncillaryEquipmentDto;

  @ApiProperty()
  ancillaryEquipmentSnapshotDate: Date;
}

class LaborCostDetails {
  @ApiProperty()
  id: string;

  @ApiProperty()
  solarOnlyLaborFeePerWatt: number;

  @ApiProperty()
  storageRetrofitLaborFeePerProject: number;

  @ApiProperty()
  solarWithAcStorageLaborFeePerProject: number;

  @ApiProperty()
  solarWithDcStorageLaborFeePerProject: number;
}

class LaborCostDto {
  @ApiProperty({ type: LaborCostDetails })
  laborCostDataSnapshot: LaborCostDetails;

  @ApiProperty()
  laborCostSnapshotDate: Date;

  @ApiProperty()
  cost: number;
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

  @ApiProperty({ type: () => BosDetailsDto, isArray: true })
  bosDetails: BosDetailsDto[];

  @ApiProperty({ type: () => AncillaryDetailsDto, isArray: true })
  ancillaryEquipmentDetails: AncillaryDetailsDto[];

  @ApiProperty()
  swellStandardMarkup: number;

  @ApiProperty()
  totalWithStandardMarkup: number;

  // @ApiProperty()
  // totalProductCost: number;

  @ApiProperty({ type: LaborCostDto })
  laborCost: LaborCostDto;

  @ApiProperty()
  grossPrice: number;
}
