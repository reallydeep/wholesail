import type { StateCode } from "@/lib/compliance/types";

export interface StateFactorResult {
  effectiveCloseDate: Date;
  disclosureRequired: boolean;
  extraFrictionHours: number;
}

function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let added = 0;
  while (added < n) {
    out.setDate(out.getDate() + 1);
    const dow = out.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return out;
}

export function applyStateFactors(
  state: StateCode | null,
  contractDate: Date,
): StateFactorResult {
  if (state === "FL") {
    return {
      effectiveCloseDate: addBusinessDays(contractDate, 3),
      disclosureRequired: true,
      extraFrictionHours: 1,
    };
  }
  if (state === "OH") {
    return {
      effectiveCloseDate: new Date(contractDate),
      disclosureRequired: true,
      extraFrictionHours: 0.5,
    };
  }
  return {
    effectiveCloseDate: new Date(contractDate),
    disclosureRequired: false,
    extraFrictionHours: 0,
  };
}
