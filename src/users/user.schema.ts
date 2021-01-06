import { Document, Schema } from 'mongoose';

export const USER = Symbol('USER').toString();

export interface IEmailSchema {
  address: string;
  verified?: boolean;
  customVerified?: boolean;
}

const EmailSchema = new Schema<IEmailSchema>(
  {
    address: String,
    verified: Boolean,
    customVerified: Boolean,
  },
  { _id: false },
);

export interface IProfileSchema {
  firstName: string;
  lastName: string;
  des?: string;
  facebookLink?: string;
  linkedInLink?: string;
  twitterLink?: string;
  avatar: string;
  color?: object;
  cellPhone?: string;
}

const ProfileSchema = new Schema<IProfileSchema>(
  {
    firstName: String,
    lastName: String,
    des: String,
    facebookLink: String,
    linkedInLink: String,
    twitterLink: String,
    avatar: String,
    color: Object,
    cellPhone: String,
  },
  { _id: false },
);

export interface User extends Document {
  _id: string;
  services: object;
  emails: IEmailSchema[];
  profile: IProfileSchema;
  roles: string[];
  hisNumber: string;
}

export const UserSchema = new Schema<User>({
  _id: String,
  services: Object,
  emails: [EmailSchema],
  profile: ProfileSchema,
  roles: [String],
  hisNumber: String,
  created_at: { type: Date, default: Date.now },
  created_by: String,
  updated_at: { type: Date, default: Date.now },
  updated_by: String,
});
