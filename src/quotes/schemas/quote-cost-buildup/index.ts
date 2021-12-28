import { Schema } from 'mongoose';
import { PanelQuoteDetailDataSchema } from './panel-quote-detail-data.schema';
import { InverterQuoteDetailDataSchema } from './inverter-quote-detail-data.schema';
import { StorageQuoteDetailDataSchema } from './storage-quote-detail-data.schema';
import { AdderQuoteDetailDataSchema } from './adder-quote-detail-data.schema';
import { BalanceOfSystemQuoteDetailDataSchema } from './balance-of-system-detail-data.schema';
import { AncillaryEquipmentQuoteDetailDataSchema } from './ancillary-equipment-quote-detail-data.schema';
import { LaborCostQuoteDetailDataSchema } from './labor-cost-quote-detail-data.schema';
import { SoftCostQuoteDetailDataSchema } from './soft-cost-quote-detail-data.schema';
import { BaseQuoteCostDataSchema } from './base-quote-cost-buildup.schema';
import { ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsSchema } from './project-subtotal-with-discounts-promotions-and-swell-gridrewards.schema';
import { BaseCostBuildupFeeSchema } from './base-cost-buildup-fee.schema';
import { AdditionalFeesSchema } from './quote-cost-buildup-additional-fee-data.schema';
import { totalPromotionsDiscountsAndSwellGridrewardsSchema } from './total-promotions-discounts-gridrewards.schema';

export const QuoteCostBuildupSchema = new Schema(
  {
    panel_quote_details: [PanelQuoteDetailDataSchema],
    inverter_quote_details: [InverterQuoteDetailDataSchema],
    storage_quote_details: [StorageQuoteDetailDataSchema],
    adder_quote_details: [AdderQuoteDetailDataSchema],
    balance_of_system_details: [BalanceOfSystemQuoteDetailDataSchema],
    ancillary_equipment_details: [AncillaryEquipmentQuoteDetailDataSchema],
    general_markup: Number,
    labor_cost_quote_details: [LaborCostQuoteDetailDataSchema],
    soft_cost_quote_details: [SoftCostQuoteDetailDataSchema],
    equipment_subtotal: BaseQuoteCostDataSchema,
    equipment_and_labor_subtotal: BaseQuoteCostDataSchema,
    equipment_labor_and_adders_subtotal: BaseQuoteCostDataSchema,
    project_gross_total: BaseQuoteCostDataSchema,
    total_promotions_discounts_and_swell_gridrewards: totalPromotionsDiscountsAndSwellGridrewardsSchema,
    project_subtotal_with_discounts_promotions_and_swell_gridrewards: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsSchema,
    subtotal_with_sales_origination_manager_fee: Number,
    sales_origination_sales_fee: BaseCostBuildupFeeSchema,
    sales_origination_manager_fee: BaseCostBuildupFeeSchema,
    third_party_financing_dealer_fee: BaseCostBuildupFeeSchema,
    additional_fees: AdditionalFeesSchema,
    project_grand_total: ProjectSubtotalWithDiscountsPromotionsAndSwellGridrewardsSchema,
  },
  { _id: false },
);
