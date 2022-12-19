import * as dayjs from 'dayjs';
import { IEnergyProfileProduction } from 'src/system-production/system-production.schema';
import { IPinballRateAmount } from 'src/utilities/utility.interface';
import { roundNumber } from './transformNumber';
import { sliceBySize, sliceBySizesMap } from './array';

export const buildMonthlyAndAnnuallyDataFrom8760 = (hourlyProduction: number[]): IEnergyProfileProduction => {
  const totalDatesOfHourlyProduction = hourlyProduction.length / 24;

  const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // leap year
  if (totalDatesOfHourlyProduction === 366) {
    datesInMonths[1] = 29;
  }

  const monthHours = datesInMonths.map(d => d * 24);

  const typicalDailyProductionPerMonths = sliceBySizesMap(hourlyProduction, monthHours)
    .map(
      (month, monthIdx) =>
        sliceBySize(month, 24)
          .reduce<number[]>((acc, cur) => {
            cur.forEach((c, idx) => {
              acc[idx] += c;
            });
            return acc;
          }, Array(24).fill(0))
          .map(e => roundNumber(e / datesInMonths[monthIdx] / 1000, 2)), // divide by 1000 to convert to KW
    )
    .map(m => {
      m.push(m[0]);
      return m;
    });

  const typicalDailyProductionPerYear = sliceBySize(hourlyProduction, 24)
    .reduce<number[]>((acc, cur) => {
      cur.forEach((c, idx) => {
        acc[idx] += c;
      });
      return acc;
    }, Array(24).fill(0))
    .map(e => roundNumber(e / totalDatesOfHourlyProduction / 1000, 2)); // divide by 1000 to convert to KW

  typicalDailyProductionPerYear.push(typicalDailyProductionPerYear[0]);

  return {
    monthlyAverage: typicalDailyProductionPerMonths,
    annualAverage: typicalDailyProductionPerYear,
  };
};

export const getMonthlyAndAnnualAverageFrom8760 = (hourlyProduction: number[]): IEnergyProfileProduction => {
  const totalDatesOfHourlyProduction = hourlyProduction.length / 24;

  const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // leap year
  if (totalDatesOfHourlyProduction === 366) {
    datesInMonths[1] = 29;
  }

  const monthHours = datesInMonths.map(d => d * 24);

  const monthlyAverage = sliceBySizesMap(hourlyProduction, monthHours).map((month, monthIdx) =>
    sliceBySize(month, 24)
      .reduce<number[]>((acc, cur) => {
        cur.forEach((c, idx) => {
          acc[idx] += c;
        });
        return acc;
      }, Array(24).fill(0))
      .map(e => e / datesInMonths[monthIdx]),
  );

  const annualAverage = sliceBySize(hourlyProduction, 24)
    .reduce<number[]>((acc, cur) => {
      cur.forEach((c, idx) => {
        acc[idx] += c;
      });
      return acc;
    }, Array(24).fill(0))
    .map(e => e / totalDatesOfHourlyProduction);

  return {
    monthlyAverage,
    annualAverage,
  };
};

export const getMonthlyAndAnnualWeekdayAverageFrom8760 = (hourlyProduction: number[]): IEnergyProfileProduction => {
  const currentYear = dayjs().year();

  const totalDatesOfHourlyProduction = hourlyProduction.length / 24;

  const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // leap year
  if (totalDatesOfHourlyProduction === 366) {
    datesInMonths[1] = 29;
  }

  const monthHours = datesInMonths.map(d => d * 24);

  const dailyHourlyProductionPerMonths = sliceBySizesMap(hourlyProduction, monthHours).map(month =>
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

  const monthlyWeekdayAverage = weekdayHourlyProductionPerMonths.map((month, monthIdx) => {
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
  const totalDates = rateAmountHourly.length / 24;

  const datesInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // leap year
  if (totalDates === 366) {
    datesInMonths[1] = 29;
  }

  const monthHours = datesInMonths.map(d => d * 24);

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

export const buildMonthlyAndAnnuallyDataFrom24HoursData = (
  data: IEnergyProfileProduction,
): IEnergyProfileProduction => {
  const typicalDailyProductionPerYear = data.annualAverage.map(e => roundNumber(e / 1000, 2));

  typicalDailyProductionPerYear.push(typicalDailyProductionPerYear[0]);

  const typicalDailyProductionPerMonths = data.monthlyAverage
    .map(month => month.map(e => roundNumber(e / 1000, 2)))
    .map(m => {
      m.push(m[0]);
      return m;
    });

  return {
    monthlyAverage: typicalDailyProductionPerMonths,
    annualAverage: typicalDailyProductionPerYear,
  };
};
