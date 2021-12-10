import { Document, Schema } from 'mongoose';
import { IAdditionalFees } from 'src/quotes/interfaces';

export const AdditionalFeesSchema = new Schema<Document & IAdditionalFees>({ total: Number }, { _id: false });
