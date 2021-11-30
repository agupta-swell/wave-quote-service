import { Schema } from 'mongoose';
import { PanelQuoteDetailDataSchema } from './panel-quote-detail-data.schema';
import { InverterQuoteDetailDataSchema } from './inverter-quote-detail-data.schema';
import { StorageQuoteDetailDataSchema } from './storage-quote-detail-data.schema';
import { AdderQuoteDetailDataSchema } from './adder-quote-detail-data.schema';
import { BalanceOfSystemQuoteDetailDataSchema } from './balance-of-system-detail-data.schema';
import { AncillaryEquipmentQuoteDetailDataSchema } from './ancillary-equipment-quote-detail-data.schema';
import { LaborCostQuoteDetailDataSchema } from './labor-cost-quote-detail-data.schema';
import { SoftCostQuoteDetailDataSchema } from './soft-cost-quote-detail-data.schema';

export const QuoteCostBuildupSchema = new Schema(
  {
    panel_quote_details: [PanelQuoteDetailDataSchema],
    inverter_quote_details: [InverterQuoteDetailDataSchema],
    storage_quote_details: [StorageQuoteDetailDataSchema],
    adder_quote_details: [AdderQuoteDetailDataSchema],
    balance_of_system_details: [BalanceOfSystemQuoteDetailDataSchema],
    ancillary_equipment_details: [AncillaryEquipmentQuoteDetailDataSchema],
    swell_standard_markup: Number,
    labor_cost_quote_details: [LaborCostQuoteDetailDataSchema],
    soft_cost_quote_details: [SoftCostQuoteDetailDataSchema],
    gross_price: Number,
    total_product_cost: Number,
  },
  { _id: false },
);
