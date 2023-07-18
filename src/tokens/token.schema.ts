import { Document, Schema } from 'mongoose';

export const TOKEN = 'TOKEN';

export interface ITokenDocument extends Document {
  _id: string;
  createdAt: Date;
  note: string;
}

export const TokenSchema = new Schema<ITokenDocument>({
  _id: String,
  createdAt: { type: Date, default: Date.now },
  note: String
});
