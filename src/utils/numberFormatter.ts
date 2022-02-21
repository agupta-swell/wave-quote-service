export const CurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const NumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});
