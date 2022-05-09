import { Document, Schema } from 'mongoose';
import { IBaseCostBuildupFee, ISalesOriginationSalesFee } from 'src/quotes/interfaces';
import { cogsImpactSchemaDefinition } from './cogs-impact.schema';
import { marginImpactSchemaDefinition } from './margin-impact.schema';

const baseCostBuildupFeeDefinition = {
  unit_percentage: Number,
  total: Number,
  ...cogsImpactSchemaDefinition,
  ...marginImpactSchemaDefinition,
};

export const BaseCostBuildupFeeSchema = new Schema<Document & IBaseCostBuildupFee>(
  {
    ...baseCostBuildupFeeDefinition,
  },
  { _id: false },
);

export const SalesOriginationSalesFeeSchema = new Schema<Document & ISalesOriginationSalesFee>(
  {
    ...baseCostBuildupFeeDefinition,
    input_type: String,
  },
  { _id: false },
);
