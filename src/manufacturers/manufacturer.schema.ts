import { Document, Schema } from 'mongoose';

export const V2_MANUFACTURERS_COLL = 'v2_manufacturers';
export interface Manufacturer extends Document {
  name: string;
}

export const ManufacturerSchema = new Schema<Manufacturer>({
  _id: Schema.Types.Mixed,
  name: String,
});
