import { Document, Schema } from 'mongoose';

export const SIGNER_ROLE_MASTER = Symbol('SIGNER_ROLE_MASTER').toString();

export interface SignerRoleMaster extends Document {
  role_name: string;
  role_description: string;
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
}

export const SignerRoleMasterSchemaWithoutId = new Schema<SignerRoleMaster>(
  {
    role_name: String,
    role_description: String,
    created_at: { type: Date, default: Date.now },
    created_by: String,
    updated_at: { type: Date, default: Date.now },
    updated_by: String,
  },
  { _id: false },
);

export const SignerRoleMasterSchema = new Schema<SignerRoleMaster>({
  role_name: String,
  role_description: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
