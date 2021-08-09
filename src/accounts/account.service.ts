import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, ACCOUNT } from './account.schema';

@Injectable()
export class AccountService {
  constructor(@InjectModel(ACCOUNT) private account: Model<Account>) {}
}
