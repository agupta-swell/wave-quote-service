import { map } from 'rxjs/operators';
import { roundNumber } from 'src/utils/transformNumber';
import { IGetTypicalUsageKwh, TypicalUsageKwh } from '../sub-services';

export const calculatePlannedUsageIncreasesKwh = map<IGetTypicalUsageKwh, IGetTypicalUsageKwh>(res => {
  const { increasePercentage, increaseAmount, annualConsumption, usage, ...p } = res;

  const newUsage = (usage.map(e =>
    e.map(v =>
      roundNumber(v + v * (increaseAmount ? increaseAmount / annualConsumption : increasePercentage / 100), 2),
    ),
  ) as unknown) as TypicalUsageKwh;

  return {
    ...p,
    increasePercentage,
    increaseAmount,
    annualConsumption,
    usage: newUsage,
  };
});
