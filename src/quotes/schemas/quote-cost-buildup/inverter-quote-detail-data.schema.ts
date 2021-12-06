import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { InverterSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const inverterQuoteDetailsDataSchemaDefinition = {
  inverter_model_data_snapshot: InverterSnapshotSchema,
  inverter_model_snapshot_date: Date,
  quantity: Number,
};

export const InverterQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.INVERTER>(
  inverterQuoteDetailsDataSchemaDefinition,
);
