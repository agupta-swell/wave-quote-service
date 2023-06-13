import * as dayjs from 'dayjs';
import { IEnergyProfileProduction } from 'src/system-productions/system-production.schema';
import { IPinballRateAmount } from 'src/utilities/utility.interface';
import { sum } from 'lodash';
import { sliceBySize, sliceBySizesMap } from './array';
import { roundNumber } from './transformNumber';

export const getDaysDataFrom8760 = (
  arrayOf8760Data: any[],
): {
  totalDays: number;
  datesInMonths: number[];
  monthHours: number[];
} => {
  const totalDays = arrayOf8760Data.length / 24;

  const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // leap year
  if (totalDays === 366) {
    datesInMonths[1] = 29;
  }

  const monthHours = datesInMonths.map(d => d * 24);

  return {
    totalDays,
    datesInMonths,
    monthHours,
  };
};

export const buildMonthlyHourFrom8760 = (hourlyProduction: number[]): number[][] => {
  const { monthHours } = getDaysDataFrom8760(hourlyProduction);

  return sliceBySizesMap(hourlyProduction, monthHours);
};

export const getMonthlyAndAnnualAverageFrom8760 = (hourlyProductionInWh: number[]): IEnergyProfileProduction => {
  const { totalDays, datesInMonths, monthHours } = getDaysDataFrom8760(hourlyProductionInWh);

  const monthlyAverage = sliceBySizesMap(hourlyProductionInWh, monthHours).map((month, monthIdx) =>
    sliceBySize(month, 24)
      .reduce<number[]>((acc, cur) => {
        cur.forEach((c, idx) => {
          acc[idx] += c;
        });
        return acc;
      }, Array(24).fill(0))
      .map(e => e / datesInMonths[monthIdx]),
  );

  const annualAverage = sliceBySize(hourlyProductionInWh, 24)
    .reduce<number[]>((acc, cur) => {
      cur.forEach((c, idx) => {
        acc[idx] += c;
      });
      return acc;
    }, Array(24).fill(0))
    .map(e => e / totalDays);

  return {
    monthlyAverage,
    annualAverage,
  };
};

export const buildMonthlyAndAnnualDataFrom24HoursData = (data: IEnergyProfileProduction): IEnergyProfileProduction => {
  const typicalDailyProductionPerYear = data.annualAverage.map(e => roundNumber(e / 1000, 2)); // convert to KWh

  typicalDailyProductionPerYear.push(typicalDailyProductionPerYear[0]);

  const typicalDailyProductionPerMonths = data.monthlyAverage
    .map(month => month.map(e => roundNumber(e / 1000, 2))) // convert to KWh
    .map(m => {
      m.push(m[0]);
      return m;
    });

  return {
    monthlyAverage: typicalDailyProductionPerMonths,
    annualAverage: typicalDailyProductionPerYear,
  };
};

export const buildMonthlyAndAnnualDataFrom8760 = (hourlyProductionInWh: number[]): IEnergyProfileProduction => {
  const monthlyAndAnnualAverage = getMonthlyAndAnnualAverageFrom8760(hourlyProductionInWh);

  return buildMonthlyAndAnnualDataFrom24HoursData(monthlyAndAnnualAverage);
};

export const getMonthlyAndAnnualWeekdayAverageFrom8760 = (hourlyProductionInWh: number[]): IEnergyProfileProduction => {
  const currentYear = dayjs().year();

  const { monthHours } = getDaysDataFrom8760(hourlyProductionInWh);

  const dailyHourlyProductionPerMonths = sliceBySizesMap(hourlyProductionInWh, monthHours).map(month =>
    sliceBySize(month, 24),
  );

  const weekdayHourlyProductionPerMonths: number[][][] = [...Array(12)].map(() => []);

  dailyHourlyProductionPerMonths.forEach((month, monthIdx) => {
    month.forEach((day, dayIdx) => {
      const date = `${currentYear}-${monthIdx + 1}-${dayIdx + 1}`;
      const dayInWeek = dayjs(date).day();
      if (![0, 6].includes(dayInWeek)) weekdayHourlyProductionPerMonths[monthIdx].push(day);
    });
  });

  const weekdaysInMonths: number[] = [];

  const monthlyWeekdayAverage = weekdayHourlyProductionPerMonths.map(month => {
    const numOfWeekdayInMonth: number = month.length;
    weekdaysInMonths.push(numOfWeekdayInMonth);

    return month
      .reduce<number[]>((acc, cur) => {
        cur.forEach((c, idx) => {
          acc[idx] += c;
        });
        return acc;
      }, Array(24).fill(0))
      .map(e => e / numOfWeekdayInMonth);
  });

  const weekdaysInCurrentYear = weekdaysInMonths.reduce((acc, cur) => acc + cur, 0);

  const annualWeekdayAverage = monthlyWeekdayAverage
    .reduce<number[]>((acc, cur, curIdx) => {
      cur.forEach((c, idx) => {
        acc[idx] += c * weekdaysInMonths[curIdx];
      });
      return acc;
    }, Array(24).fill(0))
    .map(e => e / weekdaysInCurrentYear);

  return {
    monthlyAverage: monthlyWeekdayAverage,
    annualAverage: annualWeekdayAverage,
  };
};

export const getMonthlyAndAnnualRateAmountFrom8760 = (
  rateAmountHourly: IPinballRateAmount[],
): {
  monthlyRateAmount: IPinballRateAmount[][];
  annualRateAmount: IPinballRateAmount[];
} => {
  const { datesInMonths, monthHours } = getDaysDataFrom8760(rateAmountHourly);

  const dailyRateAmountHourlyPerMonths = sliceBySizesMap(rateAmountHourly, monthHours).map(month =>
    sliceBySize(month, 24),
  );

  const annualRateAmount: IPinballRateAmount[] = dailyRateAmountHourlyPerMonths[5][14];

  const monthlyRateAmount: IPinballRateAmount[][] = [];

  dailyRateAmountHourlyPerMonths.forEach((month, monthIdx) => {
    const middleDayOfMonth = roundNumber(datesInMonths[monthIdx] / 2, 0);
    monthlyRateAmount.push(month[middleDayOfMonth - 1]);
  });

  return {
    monthlyRateAmount,
    annualRateAmount,
  };
};

export const buildMonthlyAndAnnualDataFromHour8760 = (
  hourlyProduction: number[],
): { annualProduction: number; monthlyProduction: number[] } => {
  const monthlyProduction = buildMonthlyHourFrom8760(hourlyProduction).map(v => sum(v));
  const annualProduction = sum(monthlyProduction);
  return {
    annualProduction,
    monthlyProduction,
  };
};
