import { Document, Schema } from 'mongoose';

export const TOOL_TIP = Symbol('TOOL_TIP').toString();

export interface IToolTipDocument extends Document {
  term: string;
  definition: string;
  createdAt: Date;
}

export const ToolTipSchema = new Schema<IToolTipDocument>({
  term: String,
  definition: String,
  createdAt: { type: Date, default: Date.now },
});
