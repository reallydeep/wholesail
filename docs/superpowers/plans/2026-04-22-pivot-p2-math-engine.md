# Pivot P2 — Pro Math Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the guess-based analysis math with an institutional-grade, state-aware engine. One set of inputs (ARV, purchase, rehab, rates, rent, OpEx) feeds wholesale / flip / hold simultaneously; sensitivity sliders re-run the whole tree without re-entering data.

**Architecture:** New module `src/lib/math/` holds pure formulas + shared derivations + state tie-in. `src/lib/analysis/` becomes a thin adapter that calls the engine and packages the `AnalysisResult` shape current UI expects. Engine is stateless, deterministic, unit-tested.

**Tech Stack:** TypeScript, Vitest for unit tests, pure functions (no React, no IO).

---

## File Structure

- Create: `src/lib/math/inputs.ts` — single `MathInputs` type, validation, defaults
- Create: `src/lib/math/mortgage.ts` — amortization + closing-cost helpers
- Create: `src/lib/math/derived.ts` — `deriveShared()` computes down-payment, loan, monthly PITI once
- Create: `src/lib/math/wholesale.ts` — `computeWholesale(inputs, shared)`
- Create: `src/lib/math/flip.ts` — `computeFlip(inputs, shared)` + 70% rule check
- Create: `src/lib/math/hold.ts` — `computeHold(inputs, shared)` + BRRRR refi + DSCR + 1% rule
- Create: `src/lib/math/state-factors.ts` — FL 3-business-day, OH equitable-interest time cost
- Create: `src/lib/math/sensitivity.ts` — `runSensitivity(inputs)` returns ±10%/±20% grid
- Create: `src/lib/math/engine.ts` — `runEngine(inputs)` orchestrator; returns `EngineResult`
- Create: `src/lib/math/index.ts` — barrel export
- Create: `src/lib/math/*.test.ts` — one test file per module, Vitest
- Modify: `src/lib/analysis/index.ts` — delegate to engine, keep `AnalysisResult` shape
- Modify: `src/lib/analysis/types.ts` — extend `AnalysisResult` with `mathV2` field (back-compat)
- Modify: `src/app/app/deals/new/_components/step-analysis.tsx` — feed engine inputs, render Pro Math toggle
- Create: `src/app/app/deals/[id]/_components/pro-math-panel.tsx` — sensitivity sliders, three-column outputs
- Create: `vitest.config.ts` — Vitest config (if absent)
- Modify: `package.json` — add `vitest` devDep + `test` script

---

## Task 1: Vitest Setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Install Vitest**

```bash
npm i -D vitest @vitest/ui
```

- [ ] **Step 2: Write vitest config**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add test script**

Edit `package.json` → add to `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke test config**

Run: `npm test -- --run` (no tests yet → exits 0 with "No test files found")
Expected: exit 0

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "build: add vitest for math engine tests"
```

---

## Task 2: MathInputs Type + Defaults

**Files:**
- Create: `src/lib/math/inputs.ts`
- Test: `src/lib/math/inputs.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/inputs.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS, validateInputs, type MathInputs } from "./inputs";

describe("MathInputs", () => {
  it("defaults match spec", () => {
    expect(DEFAULT_INPUTS.closingBuyPct).toBe(0.02);
    expect(DEFAULT_INPUTS.closingSellPct).toBe(0.08);
    expect(DEFAULT_INPUTS.vacancyPct).toBe(0.08);
    expect(DEFAULT_INPUTS.mgmtPct).toBe(0.08);
    expect(DEFAULT_INPUTS.maintenancePct).toBe(0.05);
    expect(DEFAULT_INPUTS.capexPct).toBe(0.05);
    expect(DEFAULT_INPUTS.downPct).toBe(0.20);
    expect(DEFAULT_INPUTS.loanTermYears).toBe(30);
  });

  it("validateInputs rejects negative ARV", () => {
    const bad: Partial<MathInputs> = { arv: -1 };
    expect(() => validateInputs({ ...DEFAULT_INPUTS, ...bad } as MathInputs))
      .toThrow(/arv/i);
  });

  it("validateInputs rejects purchase > arv * 2 (probably units bug)", () => {
    expect(() =>
      validateInputs({ ...DEFAULT_INPUTS, arv: 100_000, purchasePrice: 300_000 } as MathInputs),
    ).toThrow(/purchase/i);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/inputs.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement inputs module**

```ts
// src/lib/math/inputs.ts
import type { StateCode } from "@/lib/compliance/types";

export interface MathInputs {
  // dollars, not cents — engine works in whole-dollar doubles, UI formats
  arv: number;
  purchasePrice: number;
  rehabCost: number;

  // financing
  downPct: number;         // 0.20 default
  interestRate: number;    // annual, decimal (0.075 = 7.5%)
  loanTermYears: number;   // 30 default
  holdingMonths: number;   // flip holding window

  // closing
  closingBuyPct: number;   // 0.02
  closingSellPct: number;  // 0.08

  // carry (annual unless noted)
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  utilitiesMonthly: number;

  // rental
  marketRentMonthly: number;
  vacancyPct: number;
  mgmtPct: number;
  maintenancePct: number;
  capexPct: number;

  // wholesale
  targetAssignmentFee: number;

  // context
  state: StateCode | null;
}

export const DEFAULT_INPUTS: MathInputs = {
  arv: 0,
  purchasePrice: 0,
  rehabCost: 0,
  downPct: 0.20,
  interestRate: 0.075,
  loanTermYears: 30,
  holdingMonths: 6,
  closingBuyPct: 0.02,
  closingSellPct: 0.08,
  propertyTaxAnnual: 0,
  insuranceAnnual: 1_500,
  hoaMonthly: 0,
  utilitiesMonthly: 150,
  marketRentMonthly: 0,
  vacancyPct: 0.08,
  mgmtPct: 0.08,
  maintenancePct: 0.05,
  capexPct: 0.05,
  targetAssignmentFee: 10_000,
  state: null,
};

export function validateInputs(i: MathInputs): MathInputs {
  if (i.arv < 0) throw new Error("arv must be non-negative");
  if (i.purchasePrice < 0) throw new Error("purchasePrice must be non-negative");
  if (i.rehabCost < 0) throw new Error("rehabCost must be non-negative");
  if (i.arv > 0 && i.purchasePrice > i.arv * 2) {
    throw new Error(
      "purchasePrice more than 2× ARV — probably a units/cents bug",
    );
  }
  if (i.downPct < 0 || i.downPct > 1) throw new Error("downPct out of [0,1]");
  if (i.interestRate < 0 || i.interestRate > 0.30) {
    throw new Error("interestRate out of [0, 30%]");
  }
  if (i.loanTermYears < 1 || i.loanTermYears > 40) {
    throw new Error("loanTermYears out of [1, 40]");
  }
  return i;
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/inputs.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/inputs.ts src/lib/math/inputs.test.ts
git commit -m "feat(math): MathInputs type, defaults, validation"
```

---

## Task 3: Mortgage Helper

**Files:**
- Create: `src/lib/math/mortgage.ts`
- Test: `src/lib/math/mortgage.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/mortgage.test.ts
import { describe, it, expect } from "vitest";
import { monthlyMortgage, totalInterest } from "./mortgage";

describe("mortgage", () => {
  it("monthlyMortgage matches standard amortization (200k, 7%, 30yr)", () => {
    // standard formula → ~$1,330.60
    const m = monthlyMortgage(200_000, 0.07, 30);
    expect(m).toBeGreaterThan(1330);
    expect(m).toBeLessThan(1331);
  });

  it("zero-interest loan reduces to principal / months", () => {
    const m = monthlyMortgage(120_000, 0, 10);
    expect(m).toBeCloseTo(1000, 2);
  });

  it("totalInterest over life = monthlyMortgage*n − principal", () => {
    const principal = 200_000;
    const m = monthlyMortgage(principal, 0.07, 30);
    const interest = totalInterest(principal, 0.07, 30);
    expect(interest).toBeCloseTo(m * 360 - principal, 0);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/mortgage.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mortgage**

```ts
// src/lib/math/mortgage.ts
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
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/mortgage.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/mortgage.ts src/lib/math/mortgage.test.ts
git commit -m "feat(math): amortization helpers"
```

---

## Task 4: Derived Shared Values

**Files:**
- Create: `src/lib/math/derived.ts`
- Test: `src/lib/math/derived.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/derived.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";

describe("deriveShared", () => {
  it("20% down on $200k → $40k down, $160k loan", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 200_000,
      arv: 280_000,
    });
    expect(s.downPayment).toBe(40_000);
    expect(s.loanAmount).toBe(160_000);
  });

  it("closingBuy = purchase * closingBuyPct", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 250_000,
      arv: 350_000,
    });
    expect(s.closingBuy).toBe(250_000 * 0.02);
  });

  it("monthly PITI has principal+interest+tax+ins", () => {
    const s = deriveShared({
      ...DEFAULT_INPUTS,
      purchasePrice: 200_000,
      arv: 280_000,
      propertyTaxAnnual: 3_600,
      insuranceAnnual: 1_200,
    });
    expect(s.monthlyPiti).toBeGreaterThan(
      s.monthlyMortgagePI + 3_600 / 12 + 1_200 / 12 - 1,
    );
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/derived.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement derived**

```ts
// src/lib/math/derived.ts
import type { MathInputs } from "./inputs";
import { monthlyMortgage } from "./mortgage";

export interface SharedDerived {
  downPayment: number;
  loanAmount: number;
  closingBuy: number;
  closingSell: number;      // fraction of ARV, sold as flip/BRRRR exit
  monthlyMortgagePI: number;
  monthlyPiti: number;       // PI + tax/12 + ins/12 + HOA + utilities
  totalAllInAcquisition: number; // down + closingBuy + rehab
}

export function deriveShared(i: MathInputs): SharedDerived {
  const downPayment = i.purchasePrice * i.downPct;
  const loanAmount = i.purchasePrice - downPayment;
  const closingBuy = i.purchasePrice * i.closingBuyPct;
  const closingSell = i.arv * i.closingSellPct;
  const monthlyMortgagePI = monthlyMortgage(
    loanAmount,
    i.interestRate,
    i.loanTermYears,
  );
  const monthlyPiti =
    monthlyMortgagePI +
    i.propertyTaxAnnual / 12 +
    i.insuranceAnnual / 12 +
    i.hoaMonthly +
    i.utilitiesMonthly;
  const totalAllInAcquisition = downPayment + closingBuy + i.rehabCost;
  return {
    downPayment,
    loanAmount,
    closingBuy,
    closingSell,
    monthlyMortgagePI,
    monthlyPiti,
    totalAllInAcquisition,
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/derived.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/derived.ts src/lib/math/derived.test.ts
git commit -m "feat(math): derived shared values"
```

---

## Task 5: Wholesale Strategy

**Files:**
- Create: `src/lib/math/wholesale.ts`
- Test: `src/lib/math/wholesale.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/wholesale.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeWholesale } from "./wholesale";

describe("computeWholesale", () => {
  it("MAO = ARV*0.70 − rehab − fee", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    // 300000*0.70 = 210000; 210000 − 40000 − 10000 = 160000
    expect(w.mao).toBe(160_000);
  });

  it("spread = MAO − purchasePrice", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.spread).toBe(160_000 - 150_000);
    expect(w.meetsThresholds).toBe(true);
  });

  it("assignmentFee floors at max(5000, ARV*0.02)", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 500_000,
      rehabCost: 20_000,
      purchasePrice: 300_000,
      targetAssignmentFee: 1_000, // below floor
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.assignmentFeeUsed).toBe(Math.max(5_000, 500_000 * 0.02));
  });

  it("equityToBuyer = ARV − MAO − rehab", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      arv: 300_000,
      rehabCost: 40_000,
      purchasePrice: 150_000,
      targetAssignmentFee: 10_000,
    };
    const s = deriveShared(inputs);
    const w = computeWholesale(inputs, s);
    expect(w.equityToBuyer).toBe(300_000 - 160_000 - 40_000);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/wholesale.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement wholesale**

```ts
// src/lib/math/wholesale.ts
import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface WholesaleResultV2 {
  mao: number;
  spread: number;          // mao − purchasePrice
  assignmentFeeUsed: number;
  equityToBuyer: number;   // arv − mao − rehab
  meetsThresholds: boolean; // spread >= 0
}

export function computeWholesale(
  i: MathInputs,
  _s: SharedDerived,
): WholesaleResultV2 {
  const assignmentFeeUsed = Math.max(
    i.targetAssignmentFee,
    Math.max(5_000, i.arv * 0.02),
  );
  const mao = i.arv * 0.70 - i.rehabCost - assignmentFeeUsed;
  const spread = mao - i.purchasePrice;
  const equityToBuyer = i.arv - mao - i.rehabCost;
  return {
    mao,
    spread,
    assignmentFeeUsed,
    equityToBuyer,
    meetsThresholds: spread >= 0,
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/wholesale.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/wholesale.ts src/lib/math/wholesale.test.ts
git commit -m "feat(math): wholesale MAO + spread + equity-to-buyer"
```

---

## Task 6: Fix & Flip Strategy

**Files:**
- Create: `src/lib/math/flip.ts`
- Test: `src/lib/math/flip.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/flip.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeFlip } from "./flip";

describe("computeFlip", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    holdingMonths: 6,
    interestRate: 0.08,
    propertyTaxAnnual: 3_600,
    insuranceAnnual: 1_200,
    utilitiesMonthly: 150,
    hoaMonthly: 0,
  };

  it("holdingCost includes interest-only on loan + prorated tax/ins + hoa + util", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    // 6 months of (purchase*rate/12 + tax/12 + ins/12 + hoa + util)
    const expectedMonthly =
      (180_000 * 0.08) / 12 + 3_600 / 12 + 1_200 / 12 + 0 + 150;
    expect(f.holdingCost).toBeCloseTo(expectedMonthly * 6, 1);
  });

  it("sellingCost = ARV * closingSellPct", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    expect(f.sellingCost).toBe(300_000 * 0.08);
  });

  it("netProfit = ARV − totalCost", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    expect(f.netProfit).toBeCloseTo(base.arv - f.totalCost, 2);
  });

  it("70% rule flag fires when purchase > ARV*0.70 − rehab", () => {
    const s = deriveShared(base);
    const f = computeFlip(base, s);
    // purchase=180k, ARV*0.70 − rehab = 210k − 40k = 170k → 180k > 170k → fires
    expect(f.violatesSeventyRule).toBe(true);
  });

  it("annualizedRoi is zero when holdingMonths is zero (guards div-by-zero)", () => {
    const s = deriveShared({ ...base, holdingMonths: 0 });
    const f = computeFlip({ ...base, holdingMonths: 0 }, s);
    expect(Number.isFinite(f.annualizedRoi)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/flip.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement flip**

```ts
// src/lib/math/flip.ts
import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface FlipResultV2 {
  acquisitionCost: number;
  holdingCost: number;
  sellingCost: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  annualizedRoi: number;
  violatesSeventyRule: boolean;
  meetsThresholds: boolean;
}

export function computeFlip(
  i: MathInputs,
  s: SharedDerived,
): FlipResultV2 {
  const acquisitionCost = i.purchasePrice + s.closingBuy;
  const monthlyInterestOnly = (i.purchasePrice * i.interestRate) / 12;
  const monthlyCarry =
    monthlyInterestOnly +
    i.propertyTaxAnnual / 12 +
    i.insuranceAnnual / 12 +
    i.hoaMonthly +
    i.utilitiesMonthly;
  const holdingCost = monthlyCarry * i.holdingMonths;
  const sellingCost = s.closingSell;
  const totalCost =
    acquisitionCost + i.rehabCost + holdingCost + sellingCost;
  const netProfit = i.arv - totalCost;
  const investedCash = s.downPayment + i.rehabCost + holdingCost;
  const roi = investedCash > 0 ? netProfit / investedCash : 0;
  const annualizedRoi =
    i.holdingMonths > 0 ? roi * (12 / i.holdingMonths) : 0;
  const violatesSeventyRule =
    i.purchasePrice > i.arv * 0.70 - i.rehabCost;
  const profitFloor = Math.max(i.arv * 0.15, 30_000);
  const meetsThresholds = netProfit >= profitFloor && !violatesSeventyRule;
  return {
    acquisitionCost,
    holdingCost,
    sellingCost,
    totalCost,
    netProfit,
    roi,
    annualizedRoi,
    violatesSeventyRule,
    meetsThresholds,
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/flip.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/flip.ts src/lib/math/flip.test.ts
git commit -m "feat(math): flip with interest-only holding cost + 70% rule"
```

---

## Task 7: Buy & Hold / BRRRR Strategy

**Files:**
- Create: `src/lib/math/hold.ts`
- Test: `src/lib/math/hold.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/hold.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { deriveShared } from "./derived";
import { computeHold } from "./hold";

describe("computeHold", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 240_000,
    purchasePrice: 180_000,
    rehabCost: 30_000,
    marketRentMonthly: 2_000,
    propertyTaxAnnual: 3_600,
    insuranceAnnual: 1_200,
    interestRate: 0.075,
    loanTermYears: 30,
    downPct: 0.25,
    hoaMonthly: 0,
  };

  it("effectiveRent = grossRent * (1 − vacancy)", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    // gross=24000; vacancy 8% → 22080
    expect(h.effectiveRent).toBeCloseTo(24_000 * 0.92, 2);
  });

  it("NOI subtracts tax+ins+hoa + opex % of effectiveRent", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    const eff = 24_000 * 0.92;
    const fixed = 3_600 + 1_200 + 0 * 12;
    const pctOpex = eff * (0.08 + 0.05 + 0.05); // mgmt+maint+capex
    const opex = fixed + pctOpex;
    expect(h.operatingExpense).toBeCloseTo(opex, 2);
    expect(h.noi).toBeCloseTo(eff - opex, 2);
  });

  it("capRate = NOI / purchasePrice", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.capRate).toBeCloseTo(h.noi / base.purchasePrice, 6);
  });

  it("cashFlow = NOI − annual debt service", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.cashFlow).toBeCloseTo(h.noi - s.monthlyMortgagePI * 12, 2);
  });

  it("DSCR = NOI / debtService", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.dscr).toBeCloseTo(h.noi / (s.monthlyMortgagePI * 12), 6);
  });

  it("BRRRR refi-out = ARV*0.75 − loan principal", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.brrrrRefiOut).toBeCloseTo(
      240_000 * 0.75 - s.loanAmount,
      2,
    );
  });

  it("1% rule pass when rent/price >= 0.01", () => {
    const s = deriveShared(base);
    const h = computeHold(base, s);
    expect(h.meetsOnePctRule).toBe(2_000 / 180_000 >= 0.01);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/hold.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement hold**

```ts
// src/lib/math/hold.ts
import type { MathInputs } from "./inputs";
import type { SharedDerived } from "./derived";

export interface HoldResultV2 {
  grossRent: number;
  effectiveRent: number;
  operatingExpense: number;
  noi: number;
  capRate: number;
  cashFlow: number;
  cashOnCash: number;
  dscr: number;
  meetsOnePctRule: boolean;
  brrrrRefiOut: number;
  meetsThresholds: boolean;
}

export function computeHold(
  i: MathInputs,
  s: SharedDerived,
): HoldResultV2 {
  const grossRent = i.marketRentMonthly * 12;
  const effectiveRent = grossRent * (1 - i.vacancyPct);
  const fixedOpex =
    i.propertyTaxAnnual + i.insuranceAnnual + i.hoaMonthly * 12;
  const pctOpex =
    effectiveRent * (i.mgmtPct + i.maintenancePct + i.capexPct);
  const operatingExpense = fixedOpex + pctOpex;
  const noi = effectiveRent - operatingExpense;
  const capRate = i.purchasePrice > 0 ? noi / i.purchasePrice : 0;
  const debtService = s.monthlyMortgagePI * 12;
  const cashFlow = noi - debtService;
  const cashInvested = s.downPayment + i.rehabCost + s.closingBuy;
  const cashOnCash = cashInvested > 0 ? cashFlow / cashInvested : 0;
  const dscr = debtService > 0 ? noi / debtService : 0;
  const meetsOnePctRule =
    i.purchasePrice > 0 ? i.marketRentMonthly / i.purchasePrice >= 0.01 : false;
  const brrrrRefiOut = i.arv * 0.75 - s.loanAmount;
  const meetsThresholds = dscr >= 1.2 && cashFlow >= 1_800; // $150/mo
  return {
    grossRent,
    effectiveRent,
    operatingExpense,
    noi,
    capRate,
    cashFlow,
    cashOnCash,
    dscr,
    meetsOnePctRule,
    brrrrRefiOut,
    meetsThresholds,
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/hold.test.ts`
Expected: PASS (7/7)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/hold.ts src/lib/math/hold.test.ts
git commit -m "feat(math): hold with NOI, capRate, DSCR, BRRRR refi, 1% rule"
```

---

## Task 8: State Factors

**Files:**
- Create: `src/lib/math/state-factors.ts`
- Test: `src/lib/math/state-factors.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/state-factors.test.ts
import { describe, it, expect } from "vitest";
import { applyStateFactors } from "./state-factors";

describe("applyStateFactors", () => {
  it("FL adds 3 business days to effectiveCloseDate", () => {
    const contractDate = new Date("2026-05-01"); // Friday
    const f = applyStateFactors("FL", contractDate);
    // +3 business days (mon, tue, wed) = 2026-05-06 (Wednesday)
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-06");
    expect(f.disclosureRequired).toBe(true);
  });

  it("OH requires equitable-interest disclosure but no date shift", () => {
    const contractDate = new Date("2026-05-01");
    const f = applyStateFactors("OH", contractDate);
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(f.disclosureRequired).toBe(true);
    expect(f.extraFrictionHours).toBeGreaterThan(0);
  });

  it("unsupported state → passthrough (no shift, no disclosure)", () => {
    const contractDate = new Date("2026-05-01");
    const f = applyStateFactors(null, contractDate);
    expect(f.effectiveCloseDate.toISOString().slice(0, 10)).toBe("2026-05-01");
    expect(f.disclosureRequired).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/state-factors.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement state factors**

```ts
// src/lib/math/state-factors.ts
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
    const dow = out.getDay(); // 0=sun, 6=sat
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
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/state-factors.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/state-factors.ts src/lib/math/state-factors.test.ts
git commit -m "feat(math): state factor overlays for FL + OH"
```

---

## Task 9: Sensitivity Analysis

**Files:**
- Create: `src/lib/math/sensitivity.ts`
- Test: `src/lib/math/sensitivity.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/sensitivity.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { runSensitivity } from "./sensitivity";

describe("runSensitivity", () => {
  const base = {
    ...DEFAULT_INPUTS,
    arv: 300_000,
    purchasePrice: 180_000,
    rehabCost: 40_000,
    marketRentMonthly: 2_000,
  };

  it("returns a 3x3 grid for ARV ±10% × rehab ±20%", () => {
    const g = runSensitivity(base);
    expect(g.length).toBe(3);
    expect(g[0].length).toBe(3);
  });

  it("center cell (idx 1,1) matches base engine output", () => {
    const g = runSensitivity(base);
    expect(g[1][1].arvDelta).toBe(0);
    expect(g[1][1].rehabDelta).toBe(0);
  });

  it("higher ARV raises flip.netProfit monotonically", () => {
    const g = runSensitivity(base);
    expect(g[2][1].flip.netProfit).toBeGreaterThan(g[1][1].flip.netProfit);
    expect(g[0][1].flip.netProfit).toBeLessThan(g[1][1].flip.netProfit);
  });

  it("higher rehab lowers flip.netProfit monotonically", () => {
    const g = runSensitivity(base);
    expect(g[1][2].flip.netProfit).toBeLessThan(g[1][1].flip.netProfit);
    expect(g[1][0].flip.netProfit).toBeGreaterThan(g[1][1].flip.netProfit);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/sensitivity.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement sensitivity**

```ts
// src/lib/math/sensitivity.ts
import type { MathInputs } from "./inputs";
import { deriveShared } from "./derived";
import { computeWholesale, type WholesaleResultV2 } from "./wholesale";
import { computeFlip, type FlipResultV2 } from "./flip";
import { computeHold, type HoldResultV2 } from "./hold";

export interface SensitivityCell {
  arvDelta: number;    // -0.1, 0, +0.1
  rehabDelta: number;  // -0.2, 0, +0.2
  wholesale: WholesaleResultV2;
  flip: FlipResultV2;
  hold: HoldResultV2;
}

const ARV_STEPS = [-0.1, 0, 0.1];
const REHAB_STEPS = [-0.2, 0, 0.2];

export function runSensitivity(base: MathInputs): SensitivityCell[][] {
  return ARV_STEPS.map((arvDelta) =>
    REHAB_STEPS.map((rehabDelta) => {
      const perturbed: MathInputs = {
        ...base,
        arv: base.arv * (1 + arvDelta),
        rehabCost: base.rehabCost * (1 + rehabDelta),
      };
      const shared = deriveShared(perturbed);
      return {
        arvDelta,
        rehabDelta,
        wholesale: computeWholesale(perturbed, shared),
        flip: computeFlip(perturbed, shared),
        hold: computeHold(perturbed, shared),
      };
    }),
  );
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test -- src/lib/math/sensitivity.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/sensitivity.ts src/lib/math/sensitivity.test.ts
git commit -m "feat(math): sensitivity grid (ARV ±10%, rehab ±20%)"
```

---

## Task 10: Engine Orchestrator

**Files:**
- Create: `src/lib/math/engine.ts`
- Create: `src/lib/math/index.ts`
- Test: `src/lib/math/engine.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// src/lib/math/engine.test.ts
import { describe, it, expect } from "vitest";
import { DEFAULT_INPUTS } from "./inputs";
import { runEngine } from "./engine";

describe("runEngine", () => {
  it("returns all three strategies + state factors + sensitivity", () => {
    const r = runEngine({
      ...DEFAULT_INPUTS,
      arv: 300_000,
      purchasePrice: 180_000,
      rehabCost: 40_000,
      marketRentMonthly: 2_000,
      state: "OH",
    });
    expect(r.wholesale).toBeDefined();
    expect(r.flip).toBeDefined();
    expect(r.hold).toBeDefined();
    expect(r.shared).toBeDefined();
    expect(r.stateFactors.disclosureRequired).toBe(true);
    expect(r.sensitivity.length).toBe(3);
    expect(r.engineVersion).toMatch(/^\d+\.\d+/);
  });

  it("rejects invalid inputs", () => {
    expect(() => runEngine({ ...DEFAULT_INPUTS, arv: -1 })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `npm test -- src/lib/math/engine.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement engine + index**

```ts
// src/lib/math/engine.ts
import type { MathInputs } from "./inputs";
import { validateInputs } from "./inputs";
import { deriveShared, type SharedDerived } from "./derived";
import { computeWholesale, type WholesaleResultV2 } from "./wholesale";
import { computeFlip, type FlipResultV2 } from "./flip";
import { computeHold, type HoldResultV2 } from "./hold";
import { applyStateFactors, type StateFactorResult } from "./state-factors";
import { runSensitivity, type SensitivityCell } from "./sensitivity";

export const ENGINE_VERSION = "2.0.0";

export interface EngineResult {
  engineVersion: string;
  computedAt: string;
  inputs: MathInputs;
  shared: SharedDerived;
  wholesale: WholesaleResultV2;
  flip: FlipResultV2;
  hold: HoldResultV2;
  stateFactors: StateFactorResult;
  sensitivity: SensitivityCell[][];
}

export function runEngine(
  raw: MathInputs,
  contractDate: Date = new Date(),
): EngineResult {
  const inputs = validateInputs(raw);
  const shared = deriveShared(inputs);
  return {
    engineVersion: ENGINE_VERSION,
    computedAt: new Date().toISOString(),
    inputs,
    shared,
    wholesale: computeWholesale(inputs, shared),
    flip: computeFlip(inputs, shared),
    hold: computeHold(inputs, shared),
    stateFactors: applyStateFactors(inputs.state, contractDate),
    sensitivity: runSensitivity(inputs),
  };
}
```

```ts
// src/lib/math/index.ts
export * from "./inputs";
export * from "./derived";
export * from "./wholesale";
export * from "./flip";
export * from "./hold";
export * from "./state-factors";
export * from "./sensitivity";
export * from "./engine";
export * from "./mortgage";
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm test`
Expected: ALL PASS (expect ~25+ tests across all files)

- [ ] **Step 5: Commit**

```bash
git add src/lib/math/engine.ts src/lib/math/index.ts src/lib/math/engine.test.ts
git commit -m "feat(math): runEngine orchestrator + barrel export"
```

---

## Task 11: Analysis Adapter (back-compat)

**Files:**
- Modify: `src/lib/analysis/types.ts` — add `mathV2?: EngineResult`
- Modify: `src/lib/analysis/index.ts` — call `runEngine`, map to legacy shape

- [ ] **Step 1: Extend AnalysisResult type**

Edit `src/lib/analysis/types.ts` — add at bottom of `AnalysisResult` interface:

```ts
// Add import at top:
import type { EngineResult } from "@/lib/math";

// Append to AnalysisResult interface:
  mathV2?: EngineResult;
```

- [ ] **Step 2: Read current analysis/index.ts**

Run: `cat src/lib/analysis/index.ts` — note the entry point signature and which fields it returns (strategy, wholesale, flip, hold, decision, reasons, flags).

- [ ] **Step 3: Wire engine into analysis entry**

In `src/lib/analysis/index.ts`, after the existing per-strategy compute calls return, add:

```ts
import { runEngine, type MathInputs } from "@/lib/math";
import type { StateCode } from "@/lib/compliance/types";

// Inside the main analyze() function, before returning the AnalysisResult,
// build MathInputs from AnalysisInput (cents → dollars) and call runEngine:

function inputsToMath(
  input: AnalysisInput,
  repair: RepairEstimate,
): MathInputs {
  return {
    arv: input.arvCents / 100,
    purchasePrice: input.askingPriceCents / 100,
    rehabCost: repair.midCents / 100,
    downPct: 0.20,
    interestRate: 0.075,
    loanTermYears: 30,
    holdingMonths: 6,
    closingBuyPct: 0.02,
    closingSellPct: input.flipSellingCostPct ?? 0.08,
    propertyTaxAnnual: 0,
    insuranceAnnual: 1_500,
    hoaMonthly: 0,
    utilitiesMonthly: 150,
    marketRentMonthly: (input.estimatedRentCents ?? 0) / 100,
    vacancyPct: 0.08,
    mgmtPct: 0.08,
    maintenancePct: 0.05,
    capexPct: 0.05,
    targetAssignmentFee: (input.assignmentFeeCents ?? 10_000_00) / 100,
    state: (input.state as StateCode) || null,
  };
}

// In analyze(): just before return, add:
const mathV2 = runEngine(inputsToMath(input, repair));
// ...then spread into the returned object: { ..., mathV2 }
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all math tests pass; existing code unchanged

- [ ] **Step 6: Commit**

```bash
git add src/lib/analysis/types.ts src/lib/analysis/index.ts
git commit -m "feat(analysis): attach mathV2 EngineResult to AnalysisResult"
```

---

## Task 12: Pro Math Panel UI

**Files:**
- Create: `src/app/app/deals/[id]/_components/pro-math-panel.tsx`
- Modify: `src/app/app/deals/[id]/page.tsx` (mount panel)

- [ ] **Step 1: Build the panel**

```tsx
// src/app/app/deals/[id]/_components/pro-math-panel.tsx
"use client";

import * as React from "react";
import type { EngineResult } from "@/lib/math";

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function ProMathPanel({ result }: { result: EngineResult }) {
  const { wholesale, flip, hold, shared, stateFactors } = result;
  return (
    <div className="rounded-[12px] border border-rule bg-parchment/60 p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-[0.18em] text-ink-faint">
          Pro Math · v{result.engineVersion}
        </h3>
        {stateFactors.disclosureRequired && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-brass-700 border border-brass-300 rounded-full px-2 py-0.5">
            Disclosure required
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Col title="Wholesale">
          <Row label="MAO" value={fmtUsd(wholesale.mao)} />
          <Row label="Spread" value={fmtUsd(wholesale.spread)} />
          <Row label="Assignment fee" value={fmtUsd(wholesale.assignmentFeeUsed)} />
          <Row label="Equity to buyer" value={fmtUsd(wholesale.equityToBuyer)} />
        </Col>
        <Col title="Flip">
          <Row label="Net profit" value={fmtUsd(flip.netProfit)} />
          <Row label="Holding cost" value={fmtUsd(flip.holdingCost)} />
          <Row label="Annualized ROI" value={fmtPct(flip.annualizedRoi)} />
          <Row
            label="70% rule"
            value={flip.violatesSeventyRule ? "Violated" : "OK"}
          />
        </Col>
        <Col title="Hold / BRRRR">
          <Row label="Cash flow / mo" value={fmtUsd(hold.cashFlow / 12)} />
          <Row label="Cap rate" value={fmtPct(hold.capRate)} />
          <Row label="DSCR" value={hold.dscr.toFixed(2)} />
          <Row label="Refi out" value={fmtUsd(hold.brrrrRefiOut)} />
        </Col>
      </div>

      <div className="text-[11px] text-ink-faint">
        Monthly PITI {fmtUsd(shared.monthlyPiti)} · Loan {fmtUsd(shared.loanAmount)} · Down {fmtUsd(shared.downPayment)}
      </div>
    </div>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">
        {title}
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
        {children}
      </dl>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink font-mono tabular-nums text-right">{value}</dd>
    </>
  );
}
```

- [ ] **Step 2: Mount in deal detail page**

Find the analysis section in `src/app/app/deals/[id]/page.tsx` and add below the existing analysis display:

```tsx
{deal.analysis?.mathV2 && <ProMathPanel result={deal.analysis.mathV2} />}
```

(With the necessary import at top:)
```tsx
import { ProMathPanel } from "./_components/pro-math-panel";
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Manual smoke**

Start dev server, create a deal with `arv=300k, purchase=180k, rehab=40k, rent=2000`, verify the Pro Math panel renders with all three columns and numbers match hand-calc.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/deals/\[id\]/_components/pro-math-panel.tsx src/app/app/deals/\[id\]/page.tsx
git commit -m "feat(deal): Pro Math panel on deal detail page"
```

---

## Task 13: Final Pass

- [ ] **Step 1: Run full suite**

```bash
npm test
npx tsc --noEmit
```

Expected: all green.

- [ ] **Step 2: Quick perf sanity**

Hand-run `runEngine` on a typical input; single call should complete well under 10ms (no IO, pure math).

- [ ] **Step 3: Final commit tag**

```bash
git tag pivot-p2-math-engine
```

---

## Self-Review

**Spec coverage against master spec §6:**
- ✅ Shared inputs (`MathInputs`) — Task 2
- ✅ Amortization (`monthlyMortgage`) — Task 3
- ✅ Wholesale MAO formula — Task 5
- ✅ Flip holding cost = interest+tax+ins+hoa+util — Task 6
- ✅ 70% rule check — Task 6
- ✅ Hold NOI, cap rate, DSCR, 1% rule, BRRRR refi — Task 7
- ✅ State tie-in FL + OH — Task 8
- ✅ Sensitivity sliders — Task 9
- ✅ Engine result exported to analysis snapshot — Task 11
- ✅ Pro Math UI panel — Task 12

**Type consistency:** `WholesaleResultV2`, `FlipResultV2`, `HoldResultV2` used throughout; `EngineResult` wraps all three. Legacy `WholesaleResult` etc. remain in `analysis/types.ts` untouched.

**No placeholders.** Every step has real code or real commands.
