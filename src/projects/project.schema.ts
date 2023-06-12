import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const PROJECT = Symbol('PROJECT').toString();

export interface Project extends Document {
  amount: Number,
}

export const ProjectSchema = new Schema<Project>({
  _id: Schema.Types.Mixed,
  amount: Number,
});

MongooseNamingStrategy.ExcludeOne(ProjectSchema);
