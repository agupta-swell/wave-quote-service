import { Document, Schema } from 'mongoose';

export interface DocusignIntegrationDocument extends Document {
  accessToken: string;
  clientId: string;
  userId: string;
  scopes: string[];
  rsaPrivateKey: string;
  expiresAt: Date;
  redirectUri: string;
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
  created_at: { type: Date, default: Date.now },
});
