import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { Account, ACCOUNT } from './account.schema';

@Injectable()
export class AccountService {
  constructor(@InjectModel(ACCOUNT) private account: Model<Account>) {}

  async getAccountByQuery(query: any): Promise<LeanDocument<Account> | null> {
    const res = await this.account.findOne(query).lean();
    return res;
  }
}
