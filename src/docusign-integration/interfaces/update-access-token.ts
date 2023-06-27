import { ObjectId } from 'mongoose';

export interface IUpdateAccessToken {
  id: string | ObjectId;
  accessToken: string;
  expiresAt: Date;
}
