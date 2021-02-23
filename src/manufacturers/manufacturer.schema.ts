import { Document, Schema } from 'mongoose';

export const MANUFACTURER = Symbol('MANUFACTURER').toString();

export interface Manufacturer extends Document {
	name: string;
}

export const ManufacturerSchema = new Schema<Manufacturer>({
	_id: Schema.Types.Mixed,
	name: String
});
