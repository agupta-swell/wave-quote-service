/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as dayjs from 'dayjs';

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const getDaysInYear = (year: number) => (isLeapYear(year) ? 366 : 365);

export const getDaysInMonth = (year: number, month: number) =>
  [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];

export const getPaymentDueDateByPeriod = (startYear: number, period: number, startMonth?: number) =>
  new Date(startYear, (startMonth || 0) + period);

export const dateAdd = (interval: 'day' | 'year' | 'month', value: number, date: Date) =>
  dayjs(date).add(value, interval).toDate();

export const getMonthDatesOfYear = (year: number): number[] => [
  31,
  isLeapYear(year) ? 29 : 28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31,
];

export const getDatesOfYear = (year: number) => (isLeapYear(year) ? 366 : 365);

export const firstSundayOfTheMonth = (year: number, month: number): number => {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  // the day of week (0 = Sunday, 6 = Saturday)
  const firstDayOfMonthDayOfWeek = firstDayOfMonth.getDay();
  const daysUntilFirstSunday = (7 - firstDayOfMonthDayOfWeek) % 7;
  const firstSunday = firstDayOfMonth.getDate() + daysUntilFirstSunday;
  return firstSunday;
};
