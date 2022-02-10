/* eslint-disable @typescript-eslint/ban-types */
import BigNumber from 'bignumber.js';
import { get } from 'lodash';

export type KeyOfType<T extends object, Of> = {
  [Key in keyof T & string]: T[Key] extends Of ? Key : never;
}[keyof T & string];

const getPropAsNum = (obj: object, key: string, defaultValue?: number): number => {
  const val = get(obj, key as any);

  if (typeof val !== 'number') {
    if (typeof defaultValue === 'number') return defaultValue;

    throw new Error(`${key} is not a number, got ${val}`);
  }

  return val;
};

export function sumBy<T extends object>(
  collection: Array<T>,
  key: KeyOfType<T, number>,
  defaultValue?: number,
): BigNumber {
  return collection.reduce((acc, cur) => acc.plus(getPropAsNum(cur, key, defaultValue)), new BigNumber(0));
}

/**
 * None type-checking version of `sumBy`
 * @param collection
 * @param key
 * @param defaultValue
 * @returns
 */
export function _sumBy(collection: Array<any>, key: string, defaultValue?: number) {
  return collection.reduce((acc, cur) => acc.plus(getPropAsNum(cur, key, defaultValue)), new BigNumber(0));
}
