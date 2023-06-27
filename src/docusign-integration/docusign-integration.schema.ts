import { Document, Schema } from 'mongoose';
import { DOCUSIGN_INTEGRATION_TYPE } from './constants';

export interface DocusignIntegrationDocument extends Document {
  accessToken: string;
  clientId: string;
  userId: string;
  scopes: string[];
  rsaPrivateKey: string;
  expiresAt: Date;
  redirectUri: string;
  type: DOCUSIGN_INTEGRATION_TYPE;
  createdAt: string;
}

export const DocusignIntegrationSchema = new Schema<DocusignIntegrationDocument>({
  access_token: String,
  client_id: String,
  user_id: String,
  scopes: [String],
  rsa_private_key: String,
  expires_at: Date,
  redirect_uri: String,
  type: String,
  created_at: { type: Date, default: Date.now },
});
