import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeProp } from 'src/shared/decorators';
import { IBaseQuoteCost, IQuoteCost, IQuoteCostBuildup } from '../../interfaces';

class QuoteCostBuildupCommon implements IBaseQuoteCost {
  @ExposeProp()
  cost: number;

  @ExposeProp()
  markupAmount: number;

  @ExposeProp()
  markupPercentage: number;

  @ExposeProp()
  netCost: number;
}

class PanelQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.MODULE> {
  @ExposeProp({ type: ProductResDto })
  panelModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.MODULE>;

  @ExposeProp()
  panelModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

class InverterQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.INVERTER> {
  @ExposeProp({ type: ProductResDto })
  inverterModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.INVERTER>;

  @ExposeProp()
  inverterModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

class StorageQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.BATTERY> {
  @ExposeProp({ type: ProductResDto })
  storageModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BATTERY>;

  @ExposeProp()
  storageModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

class AdderQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.ADDER> {
  @ExposeProp({ type: ProductResDto })
  adderModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ADDER>;

  @ExposeProp()
  adderModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

class BalanceOfSystemDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM> {
  @ExposeProp({ type: ProductResDto })
  balanceOfSystemModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BALANCE_OF_SYSTEM>;

  @ExposeProp()
  balanceOfSystemModelSnapshotDate: Date;
}

class AncillaryDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT> {
  @ExposeProp({ type: ProductResDto })
  ancillaryEquipmentModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>;

  @ExposeProp()
  ancillaryEquipmentModelSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

// TODO WAV-1374
export class LaborCostDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.LABOR> {
  @ExposeProp({ type: ProductResDto })
  laborCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.LABOR>;

  @ExposeProp()
  laborCostSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

export class SoftCostDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.SOFT_COST> {
  @ExposeProp({ type: ProductResDto })
  softCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>;

  @ExposeProp()
  softCostSnapshotDate: Date;

  @ExposeProp()
  quantity: number;
}

export class QuoteCostBuildupDto implements IQuoteCostBuildup {
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

  @ExposeProp({ type: LaborCostDetailsDto })
  laborCostQuoteDetails: LaborCostDetailsDto[];

  @ExposeProp({ type: SoftCostDetailsDto })
  softCostQuoteDetails: SoftCostDetailsDto[];

  @ExposeProp()
  grossPrice: number;

  @ExposeProp()
  swellStandardMarkup: number;

  @ExposeProp()
  totalProductCost: number;
}
