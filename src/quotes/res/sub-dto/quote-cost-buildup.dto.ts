import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ELaborCostType } from 'src/quotes/constants';
import { LaborCostDetails } from 'src/quotes/req/sub-dto/quote-cost-buildup.dto';
import { ExposeAndMap, ExposeMongoId, ExposeProp } from 'src/shared/decorators';
import { AncillaryEquipmentDto } from 'src/system-designs/res/sub-dto';

class QuoteCostBuildupCommon {
  @ExposeProp()
  quantity: number;

  @ExposeProp()
  cost: number;

  @ExposeProp()
  subcontractorMarkup: number;

  @ExposeProp()
  netCost: number;
}

class PanelQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: ProductResDto })
  panelModelDataSnapshot: ProductResDto;

  @ExposeProp()
  panelModelSnapshotDate: Date;

  @ExposeProp()
  discountDetails: { amount: number; description: string }[];

  @ExposeProp()
  panelModelId: string;

  @ExposeProp()
  markup: number;
}

class InverterQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: ProductResDto })
  inverterModelDataSnapshot: ProductResDto;

  @ExposeProp()
  inverterModelSnapshotDate: Date;

  @ExposeProp()
  discountDetails: { amount: number; description: string }[];

  @ExposeProp()
  inverterModelId: string;

  @ExposeProp()
  markup: number;
}

class StorageQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: ProductResDto })
  storageModelDataSnapshot: ProductResDto;

  @ExposeProp()
  storageModelSnapshotDate: Date;

  @ExposeProp()
  discountDetails: { amount: number; description: string }[];

  @ExposeProp()
  markup: number;

  @ExposeProp()
  storageModelId: string;
}

class AdderQuoteDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: ProductResDto, skipTransform: true })
  adderModelDataSnapshot: ProductResDto;

  @ExposeProp()
  adderModelSnapshotDate: Date;

  @ExposeProp()
  adderModelId: string;

  @ExposeProp()
  discountDetails: { amount: number; description: string }[];

  @ExposeProp()
  markup: number;

  @ExposeProp()
  unit: string;
}

class BalanceOfSystemDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: ProductResDto })
  balanceOfSystemModelDataSnapshot: ProductResDto;

  @ExposeProp()
  balanceOfSystemModelDataSnapshotDate: Date;

  @ExposeProp()
  unit: string;
}

class AncillaryDetailsDto extends QuoteCostBuildupCommon {
  @ExposeProp({ type: AncillaryEquipmentDto })
  ancillaryEquipmentModelDataSnapshot: AncillaryEquipmentDto;

  @ExposeProp()
  ancillaryEquipmentSnapshotDate: Date;
}

export class LaborCostDetailsDto {
  @ExposeMongoId({ eitherId: true })
  _id: string;

  @ExposeMongoId({ eitherId: true })
  id: string;

  @ExposeProp()
  calculationType: string;

  @ExposeAndMap({}, ({ obj }) => obj.calculationType)
  calculation_type: string;

  @ExposeProp()
  unit: number;
}
export class LaborCostDto {
  @ExposeProp({ type: LaborCostDetailsDto })
  laborCostDataSnapshot: LaborCostDetailsDto;

  @ExposeProp()
  laborCostSnapshotDate: Date;

  @ExposeProp()
  cost: number;

  @ExposeProp()
  markup: number;

  @ExposeProp()
  netCost: number;

  @ExposeProp()
  discountDetails: { amount: number; description: string }[];

  @ExposeProp()
  laborCostType: ELaborCostType;
}

export class QuoteCostBuildupDto {
  @ExposeProp({ type: PanelQuoteDetailsDto, isArray: true })
  panelQuoteDetails: PanelQuoteDetailsDto[];

  @ExposeProp({ type: InverterQuoteDetailsDto, isArray: true })
  inverterQuoteDetails: InverterQuoteDetailsDto[];

  @ExposeProp({ type: StorageQuoteDetailsDto, isArray: true })
  storageQuoteDetails: StorageQuoteDetailsDto[];

  @ExposeProp({ type: AdderQuoteDetailsDto, isArray: true })
  adderQuoteDetails: AdderQuoteDetailsDto[];

  @ExposeProp({ type: BalanceOfSystemDetailsDto, isArray: true })
  balanceOfSystemDetails: BalanceOfSystemDetailsDto[];

  @ExposeProp({ type: AncillaryDetailsDto, isArray: true })
  ancillaryEquipmentDetails: AncillaryDetailsDto[];

  @ExposeProp()
  generalMarkup: number;

  @ExposeProp({ type: LaborCostDto })
  laborCost: LaborCostDto;

  @ExposeProp()
  grossPrice: number;

  @ExposeProp()
  totalNetCost: number;
}
