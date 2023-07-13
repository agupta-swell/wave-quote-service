import { Document, Schema } from 'mongoose';

export const TOKEN = 'TOKEN';

export interface ITokenDocument extends Document {
  createdAt: Date;
  note: string;
}

export const TokenSchema = new Schema<ITokenDocument>({
  createdAt: { type: Date, default: Date.now },
  note: String
});