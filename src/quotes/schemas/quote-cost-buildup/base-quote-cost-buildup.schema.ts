import { Document, Schema } from 'mongoose';
import { PRODUCT_TYPE } from 'src/products-v2/constants';
import { IBaseQuoteCost, IQuoteCostDocument } from 'src/quotes/interfaces';

const baseQuoteCostBuildupSchemaDefinition = {
  cost: Number,
  markup_percentage: Number,
  markup_amount: Number,
  net_cost: Number,
};

export const BaseQuoteCostDataSchema = new Schema<Document & IBaseQuoteCost>(baseQuoteCostBuildupSchemaDefinition);

export const createQuoteCostBuildupSchema = <T extends PRODUCT_TYPE>(
  schema: Record<string, any>,
): Schema<IQuoteCostDocument<T>> => new Schema({ ...schema, ...baseQuoteCostBuildupSchemaDefinition }, { _id: false });
