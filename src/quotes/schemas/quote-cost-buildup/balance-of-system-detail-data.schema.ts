import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { BalanceOfSystemSnapshotSchema } from 'src/products-v2/schemas';
import { createQuoteCostBuildupSchema } from './base-quote-cost-buildup.schema';

const balanceOfSystemQuoteDetailsDataSchemaDefinition = {
  balance_of_system_model_data_snapshot: BalanceOfSystemSnapshotSchema,
  balance_of_system_model_snapshot_date: Date,
  quantity: Number,
};

export const BalanceOfSystemQuoteDetailDataSchema = createQuoteCostBuildupSchema<PRODUCT_TYPE.BALANCE_OF_SYSTEM>(
  balanceOfSystemQuoteDetailsDataSchemaDefinition,
);
