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
