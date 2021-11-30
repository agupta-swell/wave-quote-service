import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { AdderSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const adderQuoteDetailsDataSchemaDefinition = {
  adder_model_data_snapshot: AdderSnapshotSchema,
  adder_model_snapshot_date: Date,
  quantity: Number,
};

export const AdderQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.ADDER>(
  adderQuoteDetailsDataSchemaDefinition,
);
