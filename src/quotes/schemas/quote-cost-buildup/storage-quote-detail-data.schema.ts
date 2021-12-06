import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { BatterySnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const storageQuoteDetailsDataSchemaDefinition = {
  storage_model_data_snapshot: BatterySnapshotSchema,
  storage_model_snapshot_date: Date,
  quantity: Number,
};

export const StorageQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.BATTERY>(
  storageQuoteDetailsDataSchemaDefinition,
);
