import { Document, Schema } from 'mongoose';
import { REQUEST_CATEGORY, REQUEST_TYPE } from '../constants';

export const FNI_COMMUNICATION = 'FNI_COMMUNICATION';

export interface FNI_Communication extends Document {
  qualificationCreditId: string;
  sentOn: Date;
  receivedOn: Date;
  vendorRefId: string;
  requestCategory: REQUEST_CATEGORY;
  requestType: REQUEST_TYPE;
  responseStatus: string;
  responseCode: string;
  rawDataFromFni: string;
  errorMessageSentToFni: string[];
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
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
