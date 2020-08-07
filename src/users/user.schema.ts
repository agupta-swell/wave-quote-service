import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

type EmailSchema = {
  address: string;
  verified?: boolean;
  customVerified?: boolean;
};

class ProfileSchema {
  firstName: string;
  lastName: string;
  des?: string;
  facebookLink?: string;
  linkedInLink?: string;
  twitterLink?: string;
  avatar: string = 'http://findicons.com/files/icons/1072/face_avatars/300/a02.png';
  color?: object;
  cellPhone?: string;
}

@Schema()
export class User extends Document {
  @Prop()
  services: object;

  @Prop()
  emails: EmailSchema[];

  @Prop({ required: false })
  profile: ProfileSchema;

  @Prop()
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
