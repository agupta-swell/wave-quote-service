import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { LaborCostSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const laborCostQuoteDetailsDataSchemaDefinition = {
  labor_cost_data_snapshot: LaborCostSnapshotSchema,
  labor_cost_snapshot_date: Date,
  quantity: Number,
};

export const LaborCostQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.LABOR>(
  laborCostQuoteDetailsDataSchemaDefinition,
);
