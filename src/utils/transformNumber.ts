/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const roundNumber = (value: number, digits: number) => {
  // digits: number of decimal number, ie: toFixed(digits)
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
    'ninteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'senventy', 'eighty', 'ninety'];

  if (value < 20) return ones[value];

  if (value < 100) {
    const [firstDigit, remainder] = value.toString().split('');

    if (+remainder === 0) return tens[+firstDigit];

    return `${tens[+firstDigit]} ${ones[+remainder]}`;
  }

  // Todo: handle bigger value
  throw new Error('Too large number');
};
