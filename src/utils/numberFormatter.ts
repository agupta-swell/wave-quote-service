export const CurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const Number2DecimalsFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const NumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});
