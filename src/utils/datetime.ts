import * as dayjs from 'dayjs';

export const isLeapYear = function (year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

export const getDaysInYear = (year: number) => (isLeapYear(year) ? 366 : 365);

export const getDaysInMonth = (year: number, month: number) =>
  [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];

export const getPaymentDueDateByPeriod = (startYear: number, period: number, startMonth?: number) => {
  const current = new Date(startYear, startMonth + period);
  return current;
};

export const dateAdd = (interval: 'day' | 'year' | 'month', value: number, date: Date) => {
  return dayjs(date).add(value, interval).toDate();
};
