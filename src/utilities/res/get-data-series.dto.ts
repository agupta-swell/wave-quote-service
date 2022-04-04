import { IGetTypicalUsageKwh } from '../sub-services';

export interface IHistoricalUsage {
  annualUsage: number[];
  monthlyUsage: number[][];
}

export class GetDataSeries {
  public historicalUsage: IHistoricalUsage;

  constructor(props: IGetTypicalUsageKwh) {
    const { usage } = props;

    const [annualUsage, ...monthlyUsage] = usage;

    this.historicalUsage = {
      annualUsage,
      monthlyUsage,
    };
  }
}

export class GetDataSeriesResDto {
  public status: string;

  public data: GetDataSeries;

  constructor(props: IGetTypicalUsageKwh) {
    this.status = 'OK';
    this.data = new GetDataSeries(props);
  }
}
