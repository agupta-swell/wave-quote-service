import { Schema, Document } from 'mongoose';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../constants';

export const FNI_COMMUNICATION = Symbol('FNI_COMMUNICATION').toString();

export interface FNI_Communication extends Document {
  qualification_credit_id: string;
  sent_on: Date;
  received_on: Date;
  vendor_ref_id: string;
  request_category: REQUEST_CATEGORY;
  request_type: REQUEST_TYPE;
  response_status: string;
  response_code: string;
  raw_data_from_fni: string;
  error_message_sent_to_fni: string[];
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const FNI_CommunicationSchema = new Schema<FNI_Communication>({
  qualification_credit_id: String,
  sent_on: Date,
  received_on: Date,
  vendor_ref_id: String,
  request_category: String,
  request_type: String,
  response_status: String,
  response_code: String,
  raw_data_from_fni: String,
  error_message_sent_to_fni: [String],
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
