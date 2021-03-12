import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { USER, User } from './user.schema';

@Injectable()
export class UserService {
  exprieTime = 86400000;

  constructor(@InjectModel(USER) private userModel: Model<User>) {}

  // ================== INTERNAL ==============

  async findByEmail(email: string): Promise<User | undefined> {
    const res = await this.userModel.find({ 'emails.address': email });
    if (!res.length) return undefined;
    return res[0];
  }

  async getUserById(userId: string): Promise<LeanDocument<User> | null> {
    const res = await this.userModel.findById(userId).lean();
    return res;
  }
}
