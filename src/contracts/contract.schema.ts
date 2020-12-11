import { Document, Schema } from 'mongoose';
import { CONTRACT_TYPE, PROCESS_STATUS, SIGN_STATUS } from './constants';

export const CONTRACT = Symbol('CONTRACT').toString();

export interface ISignerDetailDataSchema {
  role_id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  sign_status: SIGN_STATUS;
  sent_on: Date;
  sign_on: Date;
}

const SignerDetailDataSchema = new Schema<ISignerDetailDataSchema>(
  {
    role_id: String,
    role: String,
    first_name: String,
    last_name: String,
    email: String,
    sign_status: String,
    sent_on: Date,
    sign_on: Date,
  },
  { _id: false },
);

export interface Contract extends Document {
  opportunity_id: string;
  contract_type: CONTRACT_TYPE;
  name: string;
  associated_quote_id: string;
  contract_template_id: string;
  signer_details: ISignerDetailDataSchema[];
  // FIXME: need to declare later
  template_detail: any;
  contracting_system: string;
  primary_contract_id: string;
  contract_status: PROCESS_STATUS;
  chnage_order_description: string;
  completion_date: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const ContractSchema = new Schema<Contract>({
  opportunity_id: String,
  contract_type: String,
  name: String,
  associated_quote_id: String,
  contract_template_id: String,
  signer_details: [SignerDetailDataSchema],
  // FIXME: need to declare later
  template_detail: {},
  contracting_system: String,
  primary_contract_id: String,
  contract_status: String,
  chnage_order_description: String,
  completion_date: String,

  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
