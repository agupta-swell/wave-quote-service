/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * @param value
 * @param digits number of decimal number default 2 digits, ie: toFixed(digits)
 */
export const roundNumber = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export const toFixNumber = (value: number, digit: number) => Number(value.toFixed(digit));

export const toWord = (value: number): string => {
  const ones = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (value < 20) return ones[value];

  if (value < 100) {
    const [firstDigit, remainder] = value.toString().split('');

    if (+remainder === 0) return tens[+firstDigit];

    return `${tens[+firstDigit]} ${ones[+remainder]}`;
  }

  // Todo: handle bigger value
  throw new Error('Too large number');
};

/**
 *
 * Add comma separator to number:
 * * numberWithCommas(10000.123456) => "10,000.123456"
 * * numberWithCommas(10000000.123456, 2) => "10,000,000.12"
 * @param x Number
 * @param decimal Number | undefined
 * @returns string
 */
export const numberWithCommas = (x: number, decimal?: number) => {
  const parts = x.toFixed(decimal).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};
