export const hc = (v) =>
  +v >= 70 ? "var(--pos)" : +v >= 45 ? "var(--warn)" : "var(--neg)";
