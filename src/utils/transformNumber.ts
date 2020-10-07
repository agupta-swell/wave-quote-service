export const roundNumber = (value: number, digits: number) => {
  // digits: number of decimal number, ie: toFixed(digits)
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
