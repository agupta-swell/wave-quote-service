import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const SYSTEM_ATTRIBUTE_MODEL = 'system_attribute';
export const SYSTEM_ATTRIBUTE_COLL = 'system_attributes';

export interface SystemAttribute extends Document {
  pvKw?: number;
  batteryKw?: number;
  batteryKwh?: number;
  opportunityId?: string;
  projectId?: string;
  gsOpportunityId?: string;
}

export const SystemAttributeSchema = new Schema<SystemAttribute>(
  {
    _id: Schema.Types.Mixed,
    pvKw: Number,
    batteryKw: Number,
    batteryKwh: Number,
    opportunityId: String,
    projectId: String,
    gsOpportunityId: String,
  },
  {
    versionKey: false,
  },
);

MongooseNamingStrategy.ExcludeOne(SystemAttributeSchema);
