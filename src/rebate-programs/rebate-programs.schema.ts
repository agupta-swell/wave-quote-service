import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const REBATE_PROGRAM = Symbol('REBATE_PROGRAM').toString();

export interface RebateProgram extends Document {
  name: string;
}

export const RebateProgramSchema = new Schema<RebateProgram>({
  _id: Schema.Types.Mixed,
  name: String,
});

MongooseNamingStrategy.ExcludeOne(RebateProgramSchema);
