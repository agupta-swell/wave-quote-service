import { Document, Schema } from 'mongoose';
import { MongooseNamingStrategy } from 'src/shared/mongoose-schema-mapper';

export const ACCOUNT_PHOTOS_COLL = Symbol('ACCOUNT_PHOTO').toString();
export interface AccountPhoto extends Document {
  accountId: string;
  imgUrl: string;
  title: string;
  type: string;
  createdAt: Date;
}

export const AccountPhotoSchema = new Schema<AccountPhoto>({
    _id: Schema.Types.Mixed,
    accountId: String,
    imgUrl: String,
    title: String,
    type: String,
    createdAt: Date,
});

MongooseNamingStrategy.ExcludeOne(AccountPhotoSchema);
