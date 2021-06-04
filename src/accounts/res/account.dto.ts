import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { ExposeMongoId, ExposeProp } from 'src/shared/decorators';

export class AccountDto {
  @ExposeMongoId()
  id: string;

  @ExposeProp({ type: FundingSourceDto, isArray: true })
  fundingSourceAccesses: FundingSourceDto[];
}
