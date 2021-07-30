import { Document, Schema } from 'mongoose';
import { REQUEST_TYPE } from './typing';

export const DOCUSIGN_COMMUNICATION = Symbol('DOCUSIGN_COMMUNICATION').toString();

export interface IDocusignAccountDetailSchema {
  accountName: string;
  accountReferenceId: string;
}

const DocusignAccountDetailSchema = new Schema<Document<IDocusignAccountDetailSchema>>(
  {
    account_name: String,
    account_reference_id: String,
  },
  { _id: false },
);

export interface DocusignCommunication extends Document {
  dateTime: Date;
  contractId?: string;
  envelopId: string;
  docusignAccountDetail: IDocusignAccountDetailSchema;
  requestType: REQUEST_TYPE;
  payloadFromDocusign: string;
  payloadToDocusign: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  proposalId?: string;
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

  proposal_id: String
});
