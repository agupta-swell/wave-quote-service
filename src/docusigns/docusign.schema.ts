import { Document, Schema } from 'mongoose';
import { REQUEST_TYPE } from './constants';

export const DOCUSIGN = Symbol('DOCUSIGN').toString();

export interface IDocusignSignAccountDetailSchema {
  account_name: string;
  account_reference_id: string;
}

const DocusignSignAccountDetailSchema = new Schema<IDocusignSignAccountDetailSchema>(
  {
    account_name: String,
    account_reference_id: String,
  },
  { _id: false },
);

export interface Docusign extends Document {
  date_time: Date;
  contract_id: string;
  envelop_id: string;
  docusign_sign_account_detail: IDocusignSignAccountDetailSchema;
  request_type: REQUEST_TYPE;
  payload_from_docusign: string;
  payload_to_docusign: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const DocusignSchema = new Schema<Docusign>({
  date_time: Date,
  contract_id: String,
  envelop_id: String,
  docusign_sign_account_detail: DocusignSignAccountDetailSchema,
  request_type: REQUEST_TYPE,
  payload_from_docusign: String,
  payload_to_docusign: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
