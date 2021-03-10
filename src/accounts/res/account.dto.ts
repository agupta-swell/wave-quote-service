import { ApiProperty } from '@nestjs/swagger';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { FundingSource } from '../../funding-sources/funding-source.schema';
import { Account } from '../account.schema';

export class AccountDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: FundingSourceDto, isArray: true })
  fundingSourceAccesses: FundingSourceDto[];

  constructor(props: Account, fundingSourceAccess: FundingSource[]) {
    this.id = props._id;
    this.fundingSourceAccesses = fundingSourceAccess.map(fundingSource => new FundingSourceDto(fundingSource));
  }
}
