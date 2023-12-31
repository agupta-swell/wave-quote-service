/* eslint-disable no-plusplus */
import { ISeason } from 'src/usage-profiles/interfaces';
import { sliceBySize, sliceBySizesMap } from 'src/utils/array';
import { getDatesOfYear, getDaysInMonth, getMonthDatesOfYear } from 'src/utils/datetime';
import { roundNumber } from 'src/utils/transformNumber';
import { ENTRY_MODE } from '../constants';
import { IUsageValue, IUtilityUsageDetails } from '../utility.schema';
import { IBaseUsage, IGetTypicalUsageKwh, TypicalUsageKwh, WithAvgUsage, WithSeason } from './typical-usage.interface';

export const calculateWeighted = <T extends IBaseUsage>(annualConsumption: number, val: T): number =>
  roundNumber((val.v / annualConsumption) * 100, 2);

export const calculateAvgUsage = <T extends IBaseUsage>(val: T, monthIdx: number): WithAvgUsage<IBaseUsage> => ({
  ...val,
  avg: roundNumber(val.v / getDaysInMonth(new Date().getFullYear(), monthIdx), 2),
});

export const calculateMonthWithSeason = <T extends WithAvgUsage<IBaseUsage>>(
  seasons: ISeason[],
  month: number,
  val: T,
): WithSeason<T> => {
  const foundSeason = seasons.find(s => s.applicableMonths.includes(month + 1));

  if (!foundSeason) {
    throw new Error(`No season found for month ${month + 1}`);
  }

  return {
    ...val,
    typicalUsages: foundSeason.hourlyAllocation.map(v => roundNumber((val.avg * v) / 100, 2)),
  };
};

const weightedAverage = (nums: number[], weights: number[]) => {
  const [sum, weightSum] = weights.reduce(
    (acc, w, i) => {
      acc[0] += nums[i] * w;
      acc[1] += w;
      return acc;
    },
    [0, 0],
  );
  return roundNumber(sum / weightSum, 2);
};

export const getCSVTypicalUsage = (hourlyUsage: IUsageValue[], currentYear: number): TypicalUsageKwh => {
  const totalDatesOfHourlyUsage = hourlyUsage.length / 24;

  const datesInMonths = getMonthDatesOfYear(currentYear);

  const monthHours = datesInMonths.map(d => d * 24);

  const typicalDailyUsagePerMonths = sliceBySizesMap(hourlyUsage, monthHours)
    .map((month, monthIdx) =>
      sliceBySize(month, 24)
        .reduce<number[]>((acc, cur) => {
          cur.forEach((c, idx) => {
            acc[idx] += c.v;
          });
          return acc;
        }, Array(24).fill(0))
        .map(e => roundNumber(e / datesInMonths[monthIdx], 2)),
    )
    .map(m => {
      m.push(m[0]);
      return m;
    });

  const typicalDailyUsagePerYear = sliceBySize(hourlyUsage, 24)
    .reduce<number[]>((acc, cur) => {
      cur.forEach((c, idx) => {
        acc[idx] += c.v;
      });
      return acc;
    }, Array(24).fill(0))
    .map(e => roundNumber(e / totalDatesOfHourlyUsage, 2));

  typicalDailyUsagePerYear.push(typicalDailyUsagePerYear[0]);

  return [typicalDailyUsagePerYear, ...typicalDailyUsagePerMonths] as TypicalUsageKwh;
};

export const getTypicalUsage = (doc: IUtilityUsageDetails): IGetTypicalUsageKwh => {
  const currentYear = new Date().getFullYear();

  const {
    utilityData: {
      computedUsage: { monthlyUsage, annualConsumption, hourlyUsage: hourlyComputedUsage },
      typicalBaselineUsage: { typicalMonthlyUsage, typicalHourlyUsage },
    },
    usageProfileSnapshot,
    increaseAmount,
    poolValue,
    electricVehicles = [],
  } = doc;

  if (doc.entryMode === ENTRY_MODE.CSV_INTERVAL_DATA) {
    const { hourlyUsage } = doc.utilityData.computedUsage;
    return {
      annualConsumption,
      usage: getCSVTypicalUsage(hourlyUsage, currentYear),
      increaseAmount,
      poolUsageKwh: poolValue / hourlyComputedUsage.length,
      electricVehicles,
    };
  }
  if (!usageProfileSnapshot) {
    const daysOfYear = 365;
    const typicalHourlyAllocation: number[] = [];

    const typicalHourlyUsageLength = typicalHourlyUsage.length;
    const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const typicalMonthlyUsageResult = typicalMonthlyUsage.map((usage, monthIndex) => {
      const _typicalHourlyAllocation: number[] = [];
      const numberOfDays = datesInMonths[monthIndex];
      const baselineRate = monthlyUsage[monthIndex].v / usage.v;

      let start = 0;
      let end = 0;

      for (let i = 0; i < monthIndex + 1; ++i) {
        start = end;
        end += datesInMonths[i] * 24;
      }

      for (let i = start; i < end; ++i) {
        const hourIndex = i % 24;
        _typicalHourlyAllocation[hourIndex] = (_typicalHourlyAllocation[hourIndex] || 0) + typicalHourlyUsage[i].v;
      }

      for (let i = 0; i < 24; ++i) {
        _typicalHourlyAllocation[i] = (_typicalHourlyAllocation[i] / numberOfDays) * baselineRate;
      }

      const typicalUsageKwh = _typicalHourlyAllocation;
      typicalUsageKwh.push(typicalUsageKwh[0]);
      return typicalUsageKwh;
    });
    const annualUsage = typicalMonthlyUsage.reduce((prev, cur) => prev + cur.v, 0);
    const start = 0;
    const end = Math.min(typicalHourlyUsageLength, daysOfYear * 24);
    const baselineRate = annualConsumption / annualUsage;

    for (let i = start; i < end; ++i) {
      const hourIndex = i % 24;
      typicalHourlyAllocation[hourIndex] = (typicalHourlyAllocation[hourIndex] || 0) + typicalHourlyUsage[i].v;
    }

    for (let i = 0; i < 24; ++i) {
      typicalHourlyAllocation[i] = (typicalHourlyAllocation[i] / daysOfYear) * baselineRate;
    }

    const typicalUsageKwh = typicalHourlyAllocation;
    typicalUsageKwh.push(typicalUsageKwh[0]);
    const annualTypicalUsageKwh = typicalUsageKwh;

    return {
      annualConsumption,
      usage: [annualTypicalUsageKwh, ...typicalMonthlyUsageResult] as TypicalUsageKwh,
      increaseAmount,
      poolUsageKwh: poolValue / (daysOfYear * 24),
      electricVehicles,
    };
  }
  if (!usageProfileSnapshot.seasons) {
    throw new Error('Missing seasons');
  }

  const { seasons } = usageProfileSnapshot;

  const calculateWeightedBindedAnnual = (v: IUsageValue) => calculateWeighted(annualConsumption, v);
  const calculateTypicalUsagesBindedSeasons = <T extends WithAvgUsage<IBaseUsage>>(val: T, monthIdx: number) =>
    calculateMonthWithSeason(seasons, monthIdx, val);

  const monthlyTypicalUsage = monthlyUsage
    .map(calculateAvgUsage)
    .map(calculateTypicalUsagesBindedSeasons)
    .map(e => e.typicalUsages)
    .map(e => {
      e.push(e[0]);
      return e;
    });

  const flattenHourlyAllocation: number[][] = [];
  seasons.forEach(season => {
    const { applicableMonths, hourlyAllocation } = season;
    applicableMonths.forEach(month => {
      flattenHourlyAllocation[month - 1] = hourlyAllocation;
    });
  });

  const datesOfCurrentYear = getDatesOfYear(currentYear);

  const avgAnnualUsage = roundNumber(annualConsumption / datesOfCurrentYear, 2);

  const monthlyUsageWeighted = monthlyUsage.map(calculateWeightedBindedAnnual);
  const hourlyUsage: number[] = [];
  const flattenHourlyAllocationLength = flattenHourlyAllocation.length;
  for (let i = 0; i < 24; ++i) {
    const temp: number[] = [];
    for (let j = 0; j < flattenHourlyAllocationLength; ++j) {
      temp.push(flattenHourlyAllocation[j][i]);
    }
    hourlyUsage.push(weightedAverage(temp, monthlyUsageWeighted));
  }

  const annualTypicalUsageKwh = hourlyUsage.map(h => roundNumber(avgAnnualUsage * (h / 100), 2));

  annualTypicalUsageKwh.push(annualTypicalUsageKwh[0]);

  return {
    annualConsumption,
    usage: [annualTypicalUsageKwh, ...monthlyTypicalUsage] as TypicalUsageKwh,
    increaseAmount,
    poolUsageKwh: poolValue / (datesOfCurrentYear * 24),
    electricVehicles,
  };
};
