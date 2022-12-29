import { FinancierDto } from 'src/financiers/res/financier.dto';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';
import { ExposeProp } from 'src/shared/decorators';

export class GetFinancialSelectionsDto {
  @ExposeProp({ type: FundingSourceDto, isArray: true })
  fundingSources: FundingSourceDto[] = [];

  @ExposeProp({ type: FinancierDto, isArray: true })
  financiers: FinancierDto[] = [];
}
