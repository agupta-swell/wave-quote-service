import { ApiProperty } from '@nestjs/swagger';
import { LeanDocument } from 'mongoose';
import { Financier } from 'src/financier/financier.schema';
import { FinancierDto } from 'src/financier/res/financier.dto';
import { FundingSource } from 'src/funding-sources/funding-source.schema';
import { FundingSourceDto } from 'src/funding-sources/res/funding-source.dto';

export class GetFinancialSelectionsDto {
  @ApiProperty()
  fundingSources: FundingSourceDto[] = [];

  @ApiProperty()
  financiers: FinancierDto[] = [];

  constructor(props: {
    fundingSources?: LeanDocument<FundingSource[]> | null;
    financiers?: LeanDocument<Financier[]> | null;
  }) {
    if (props.fundingSources) this.fundingSources = props.fundingSources.map(e => new FundingSourceDto(e));
    if (props.financiers) this.financiers = props.financiers.map(e => new FinancierDto(e));
  }
}
