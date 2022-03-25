import { map } from 'rxjs/operators';
import { roundNumber } from 'src/utils/transformNumber';
import { IGetTypicalUsageKwh, TypicalUsageKwh } from '../sub-services';

export const calculatePoolUsageKwh = map<IGetTypicalUsageKwh, IGetTypicalUsageKwh>(res => {
  const { usage, poolUsageKwh, ...p } = res;

  const newUsage = (usage.map(e => e.map(v => roundNumber(v + poolUsageKwh, 2))) as unknown) as TypicalUsageKwh;

  return {
    ...p,
    poolUsageKwh,
    usage: newUsage,
  };
});
