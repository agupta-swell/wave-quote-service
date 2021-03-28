import { Document, Schema } from 'mongoose';
import {REQUEST_TYPE} from "./typing";

export const DOCUSIGN_COMMUNICATION = Symbol('DOCUSIGN_COMMUNICATION').toString();

export interface IDocusignAccountDetailSchema {
  account_name: string;
  account_reference_id: string;
}

const DocusignAccountDetailSchema = new Schema<Document<IDocusignAccountDetailSchema>>(
  {
    account_name: String,
    account_reference_id: String,
  },
  { _id: false },
);

export interface DocusignCommunication extends Document {
  date_time: Date;
  contract_id: string;
  envelop_id: string;
  docusign_account_detail: IDocusignAccountDetailSchema;
  request_type: REQUEST_TYPE;
  payload_from_docusign: string;
  payload_to_docusign: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const DocusignCommunicationSchema = new Schema<DocusignCommunication>({
  date_time: Date,
  contract_id: String,
  envelop_id: String,
  docusign_account_detail: DocusignAccountDetailSchema,
  request_type: String,
  payload_from_docusign: String,
  payload_to_docusign: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
