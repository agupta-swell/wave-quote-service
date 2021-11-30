import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { ModuleSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const panelQuoteDetailsDataSchemaDefinition = {
  panel_model_data_snapshot: ModuleSnapshotSchema,
  panel_model_snapshot_date: Date,
  quantity: Number,
};

export const PanelQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.MODULE>(
  panelQuoteDetailsDataSchemaDefinition,
);
