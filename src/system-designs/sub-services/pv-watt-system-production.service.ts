import { sliceBySize, sliceBySizesMap } from 'src/utils/array';
import { roundNumber } from 'src/utils/transformNumber';

export const getTypicalProduction = (hourlyProduction: number[]) => {
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
          .map(e => roundNumber(e / datesInMonths[monthIdx] / 1000, 2)), // device by 1000 to convert to KW
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
    .map(e => roundNumber(e / totalDatesOfHourlyProduction / 1000, 2)); // device by 1000 to convert to KW

  typicalDailyProductionPerYear.push(typicalDailyProductionPerYear[0]);

  return {
    monthlyAverage: typicalDailyProductionPerMonths,
    annualAverage: typicalDailyProductionPerYear,
  };
};
