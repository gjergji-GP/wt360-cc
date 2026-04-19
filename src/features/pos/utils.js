export const fmtN = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
export const elapsed = (ts) => (!ts ? 0 : Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
export const ageClass = (s) => (s < 180 ? "age-green" : s < 420 ? "age-amber" : "age-red");
export const timerColor = (s) => (s < 180 ? "tc-green" : s < 420 ? "tc-amber" : "tc-red");
