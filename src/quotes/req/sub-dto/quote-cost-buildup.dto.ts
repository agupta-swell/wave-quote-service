import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IQuoteCost, IQuoteCostBuildup } from 'src/quotes/interfaces';
import { IBaseQuoteCost } from 'src/quotes/interfaces/quote-cost-buildup/IBaseQuoteCost';
import { IProjectSubtotal4 } from 'src/quotes/interfaces/quote-cost-buildup/IProjectSubtotal4';
import {
  TotalPromotionsDiscountsAndSwellGridrewardsDto,
  BaseCostBuildupFeeDto,
  AdditionalFeesDto,
} from 'src/quotes/res/sub-dto';
import { ExposeProp } from 'src/shared/decorators';
import { AncillaryEquipmentDto } from 'src/system-designs/res/sub-dto';

class QuoteCostBuildupCommon implements IBaseQuoteCost {
  @ApiProperty()
  @IsNumber()
  markupPercentage: number;

  @ApiProperty()
  @IsNumber()
  markupAmount: number;

  @ApiProperty()
  @IsNumber()
  cost: number;

  @ApiProperty()
  @IsNumber()
  netCost: number;
}

class PanelQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.MODULE> {
  @ApiProperty()
  panelModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.MODULE>;

  @ApiProperty()
  panelModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

class InverterQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.INVERTER> {
  @ApiProperty()
  inverterModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.INVERTER>;

  @ApiProperty()
  inverterModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class StorageQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.BATTERY> {
  @ApiProperty()
  storageModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BATTERY>;

  @ApiProperty()
  storageModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

class AdderQuoteDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.ADDER> {
  @ApiProperty()
  adderModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ADDER>;

  @ApiProperty()
  adderModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

class BalanceOfSystemDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.BALANCE_OF_SYSTEM> {
  @ApiProperty()
  balanceOfSystemModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.BALANCE_OF_SYSTEM>;

  @ApiProperty()
  balanceOfSystemModelSnapshotDate: Date;
}

class AncillaryDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.ANCILLARY_EQUIPMENT> {
  @ApiProperty({ type: AncillaryEquipmentDto })
  ancillaryEquipmentModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>;

  @ApiProperty()
  ancillaryEquipmentModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class LaborCostDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.LABOR> {
  @ApiProperty()
  laborCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.LABOR>;

  @ApiProperty()
  laborCostSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class SoftCostDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.SOFT_COST> {
  @ApiProperty({ type: '' })
  softCostDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>;

  @ApiProperty()
  softCostSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class ProjectSubtotal4Dto implements IProjectSubtotal4 {
  @ApiProperty()
  cost: number;

  @ApiProperty()
  marginPercentage: number;

  @ApiProperty()
  netMargin: number;

  @ApiProperty()
  netCost: number;
}

export class QuoteCostBuildupDto implements IQuoteCostBuildup {
  @ApiProperty({ type: PanelQuoteDetailsDto, isArray: true })
  panelQuoteDetails: PanelQuoteDetailsDto[];

  @ApiProperty({ type: InverterQuoteDetailsDto, isArray: true })
  inverterQuoteDetails: InverterQuoteDetailsDto[];

  @ApiProperty({ type: StorageQuoteDetailsDto, isArray: true })
  storageQuoteDetails: StorageQuoteDetailsDto[];

  @ApiProperty({ type: AdderQuoteDetailsDto, isArray: true })
  adderQuoteDetails: AdderQuoteDetailsDto[];

  @ApiProperty({ type: BalanceOfSystemDetailsDto, isArray: true })
  balanceOfSystemDetails: BalanceOfSystemDetailsDto[];

  @ApiProperty({ type: AncillaryDetailsDto, isArray: true })
  ancillaryEquipmentDetails: AncillaryDetailsDto[];

  @ApiProperty({ type: LaborCostDetailsDto, isArray: true })
  laborCostQuoteDetails: LaborCostDetailsDto[];

  @ApiProperty({ type: SoftCostDetailsDto, isArray: true })
  softCostQuoteDetails: SoftCostDetailsDto[];

  @ApiProperty()
  generalMarkup: number;

  @ApiProperty()
  grossPrice: number;

  @ApiProperty({ type: QuoteCostBuildupCommon })
  equipmentAndLaborAndAddersSubtotal: QuoteCostBuildupCommon;

  @ApiProperty({ type: QuoteCostBuildupCommon })
  equipmentAndLaborSubtotal: QuoteCostBuildupCommon;

  @ApiProperty({ type: QuoteCostBuildupCommon })
  equipmentSubtotal: QuoteCostBuildupCommon;

  @ApiProperty({ type: QuoteCostBuildupCommon })
  projectSubtotal3: QuoteCostBuildupCommon;

  @ApiProperty({ type: ProjectSubtotal4Dto })
  projectSubtotal4: ProjectSubtotal4Dto;

  @ApiProperty({ type: ProjectSubtotal4Dto })
  projectGrandTotal: ProjectSubtotal4Dto;

  @ExposeProp({ type: TotalPromotionsDiscountsAndSwellGridrewardsDto })
  totalPromotionsDiscountsAndSwellGridrewards: TotalPromotionsDiscountsAndSwellGridrewardsDto;

  @ExposeProp({ type: BaseCostBuildupFeeDto })
  salesOriginationManagerFee: BaseCostBuildupFeeDto;

  @ExposeProp({ type: BaseCostBuildupFeeDto })
  salesOriginationSalesFee: BaseCostBuildupFeeDto;

  @ExposeProp()
  subtotalWithSalesOriginationManagerFee: number;

  @ExposeProp({ type: AdditionalFeesDto })
  additionalFees: AdditionalFeesDto;
}
