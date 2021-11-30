import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ISnapshotProduct } from 'src/products-v2/interfaces';
import { IQuoteCost, IQuoteCostBuildup } from 'src/quotes/interfaces';
import { IBaseQuoteCost } from 'src/quotes/interfaces/quote-cost-buildup/IBaseQuoteCost';
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
  laborCostModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.LABOR>;

  @ApiProperty()
  laborCostModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class SoftCostDetailsDto extends QuoteCostBuildupCommon implements IQuoteCost<PRODUCT_TYPE.SOFT_COST> {
  @ApiProperty({ type: '' })
  softCostModelDataSnapshot: ISnapshotProduct<PRODUCT_TYPE.SOFT_COST>;

  @ApiProperty()
  softCostModelSnapshotDate: Date;

  @ApiProperty()
  @IsNumber()
  quantity: number;
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
  swellStandardMarkup: number;

  @ApiProperty()
  grossPrice: number;

  @ApiProperty()
  totalProductCost: number;
}
