import type { MathInputs } from "./inputs";
import { deriveShared } from "./derived";
import { computeWholesale, type WholesaleResultV2 } from "./wholesale";
import { computeFlip, type FlipResultV2 } from "./flip";
import { computeHold, type HoldResultV2 } from "./hold";

export interface SensitivityCell {
  arvDelta: number;
  rehabDelta: number;
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
