/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable no-restricted-syntax */
import { isValidObjectId } from 'mongoose';

const snakeToCamel = (str: string) => str.replace(/([-_][a-zA-Z])/g, group => group[1].toUpperCase().replace('-', ''));

const camelToUnderscore = (str: string) =>
  str
    .replace(/([A-Z])/g, '_$1')
    .split(' ')
    .join('_')
    .toLowerCase();

export const toCamelCase = <T extends unknown>(obj) => {
  const newObj = {};

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      if (obj[key] instanceof Date || Array.isArray(obj[key]) || isValidObjectId(obj[key])) {
        newObj[snakeToCamel(key === '_id' ? 'id' : key)] = obj[key];
      } else {
        const deeper = toCamelCase(obj[key]);
        newObj[snakeToCamel(key)] = deeper;
      }
    } else {
      newObj[snakeToCamel(key === '_id' ? 'id' : key)] = obj[key];
    }
  }

  return newObj as T;
};

export const toSnakeCase = <T extends unknown>(obj) => {
  const newObj = {};
  const exceptValues = ['sizekWh', 'sizeW'];

  for (const key in obj) {
    if (exceptValues.find(item => item === key)) {
      newObj[key] = obj[key];
    } else if (typeof obj[key] === 'object') {
      if (obj[key] instanceof Date || Array.isArray(obj[key])) {
        newObj[camelToUnderscore(key)] = obj[key];
      } else {
        const deeper = toSnakeCase(obj[key]);
        newObj[camelToUnderscore(key)] = deeper;
      }
    } else {
      newObj[camelToUnderscore(key)] = obj[key];
    }
  }
  return newObj as T;
};
