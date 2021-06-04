import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LeanDocument, Model } from 'mongoose';
import { ApplicationException } from 'src/app/app.exception';
import { OperationResult } from 'src/app/common';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceService } from 'src/funding-sources/funding-source.service';
import { strictPlainToClass } from 'src/shared/transform/strict-plain-to-class';
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
      throw ApplicationException.EntityNotFound(id);
    }

    let fundingSources: (LeanDocument<FundingSource> | FundingSource | null)[];

    if (account.fundingSourceAccess?.length) {
      fundingSources = await Promise.all(
        account.fundingSourceAccess.map(id => this.fundingSourceService.getDetailById(id)),
      );
    } else {
      fundingSources = await this.fundingSourceService.getAll();
    }

    return OperationResult.ok(
      strictPlainToClass(AccountDto, {
        _id: account._id,
        fundingSourceAccesses: fundingSources.filter(e => e),
      }),
    );
  }
}
