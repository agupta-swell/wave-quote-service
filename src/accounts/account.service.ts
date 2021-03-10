import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compact } from 'lodash';
import { Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { Account, ACCOUNT } from './account.schema';
import { AccountDto } from './res/account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(ACCOUNT) private account: Model<Account>,
    private readonly fundingSourceService: FundingSourceService,
  ) {}

  async getFundingSourceAccesses(id: string): Promise<OperationResult<AccountDto>> {
    const account = await this.account.findById(id);
    if (!account) {
      throw ApplicationException.EnitityNotFound(id);
    }

    const fundingSources = await Promise.all(
      account.fundingSourceAccess.map(id => this.fundingSourceService.getDetailById(id)),
    );

    return OperationResult.ok(new AccountDto(account, compact(fundingSources)));
  }
}
