import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { ProductResDto } from 'src/products-v2/res/product.dto';
import { ExposeProp } from 'src/shared/decorators';
import {
  IBaseQuoteCost,
  IQuoteCost,
  IQuoteCostBuildup,
  IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards,
  IBaseCostBuildupFee,
  IAdditionalFees,
  ITotalPromotionsDiscountsAndSwellGridrewards,
} from 'src/quotes/interfaces';

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

export class ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsDto
  implements IProjectSubtotalWithDiscountsPromotionsAndSwellGridrewards {
  @ExposeProp()
  cost: number;

  @ExposeProp()
  marginPercentage: number;

  @ExposeProp()
  netMargin: number;

  @ExposeProp()
  netCost: number;
}

export class TotalPromotionsDiscountsAndSwellGridrewardsDto implements ITotalPromotionsDiscountsAndSwellGridrewards {
  @ExposeProp()
  total: number;
}

export class BaseCostBuildupFeeDto implements IBaseCostBuildupFee {
  @ExposeProp()
  unitPercentage: number;

  @ExposeProp()
  total: number;
}

export class AdditionalFeesDto implements IAdditionalFees {
  @ExposeProp()
  total: number;
}

export class QuoteCostBuildupUserInputDto {
  totalPercentageReduction?: number;

  totalAmountReduction?: number;

  salesOriginationSalesFee?: BaseCostBuildupFeeDto;
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
  generalMarkup: number;

  @ExposeProp({ type: QuoteCostBuildupCommon })
  equipmentLaborAndAddersSubtotal: QuoteCostBuildupCommon;

  @ExposeProp({ type: QuoteCostBuildupCommon })
  equipmentAndLaborSubtotal: QuoteCostBuildupCommon;

  @ExposeProp({ type: QuoteCostBuildupCommon })
  equipmentSubtotal: QuoteCostBuildupCommon;

  @ExposeProp({ type: QuoteCostBuildupCommon })
  projectGrossTotal: QuoteCostBuildupCommon;

  @ExposeProp({ type: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsDto })
  projectSubtotalWithDiscountsPromotionsAndSwellGridrewards: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsDto;

  @ExposeProp({ type: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsDto })
  projectGrandTotal: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsDto;

  @ExposeProp({ type: TotalPromotionsDiscountsAndSwellGridrewardsDto })
  totalPromotionsDiscountsAndSwellGridrewards: TotalPromotionsDiscountsAndSwellGridrewardsDto;

  @ExposeProp({ type: BaseCostBuildupFeeDto })
  salesOriginationManagerFee: BaseCostBuildupFeeDto;

  @ExposeProp({ type: BaseCostBuildupFeeDto })
  salesOriginationSalesFee: BaseCostBuildupFeeDto;

  @ExposeProp({ type: BaseCostBuildupFeeDto })
  thirdPartyFinancingDealerFee: BaseCostBuildupFeeDto;

  @ExposeProp()
  subtotalWithSalesOriginationManagerFee: number;

  @ExposeProp({ type: AdditionalFeesDto })
  additionalFees: AdditionalFeesDto;
}
