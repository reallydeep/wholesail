export function monthlyMortgage(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0) return 0;
  const n = termYears * 12;
  if (annualRate === 0) return principal / n;
  const r = annualRate / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export function totalInterest(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const m = monthlyMortgage(principal, annualRate, termYears);
  return m * termYears * 12 - principal;
}
