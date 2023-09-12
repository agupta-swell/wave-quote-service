import { InjectModel } from "@nestjs/mongoose";
import { LeanDocument, Model, ObjectId } from 'mongoose';
import { AccountService } from "src/accounts/account.service";
import { AccountPhoto, ACCOUNT_PHOTOS_COLL } from "./account-photo.schema";

export class AccountPhotoService {
  constructor(
    @InjectModel(ACCOUNT_PHOTOS_COLL) 
    private accountPhoto: Model<AccountPhoto>,
    private accountService: AccountService,
  ) {}

  async getAccountPhotoByQuery(query: any, accountQuery: any): Promise<LeanDocument<AccountPhoto> | null> {
    const account = await this.accountService.getAccountByQuery(accountQuery);
    
    if(account) {
      const res = await this.accountPhoto.findOne(query).lean();
      return res;
    }
    return null;
  }
}
