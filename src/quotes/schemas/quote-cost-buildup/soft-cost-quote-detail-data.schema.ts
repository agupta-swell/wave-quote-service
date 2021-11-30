import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { SoftCostSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const softCostQuoteDetailsDataSchemaDefinition = {
  soft_cost_model_data_snapshot: SoftCostSnapshotSchema,
  soft_cost_model_snapshot_date: Date,
  quantity: Number,
};

export const SoftCostQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.SOFT_COST>(
  softCostQuoteDetailsDataSchemaDefinition,
);
