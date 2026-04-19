export const fmtCurrency = (value) => {
  const amount = +value || 0;
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} L`;
};
