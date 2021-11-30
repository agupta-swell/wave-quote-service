import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { AncillaryEquipmentSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const ancillaryEquipmentQuoteDetailsDataSchemaDefinition = {
  ancillary_equipment_model_data_snapshot: AncillaryEquipmentSnapshotSchema,
  ancillary_equipment_model_snapshot_date: Date,
  quantity: Number,
};

export const AncillaryEquipmentQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.ANCILLARY_EQUIPMENT>(
  ancillaryEquipmentQuoteDetailsDataSchemaDefinition,
);
