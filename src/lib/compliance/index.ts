import { ALL_OH } from "./rules/oh";
import { ALL_FL } from "./rules/fl";
import { ALL_TX } from "./rules/tx";
import { ALL_GA } from "./rules/ga";
import { ALL_TN } from "./rules/tn";
import { ALL_MI } from "./rules/mi";
import { ALL_NC } from "./rules/nc";
import { ALL_GREEN } from "./rules/green";
import type {
  ComplianceDecision,
  ComplianceWarning,
  StateCode,
  StateRuleSet,
  Strategy,
} from "./types";

const ALL_RULES: StateRuleSet[] = [
  ...ALL_GREEN,
  ...ALL_OH,
  ...ALL_FL,
  ...ALL_TX,
  ...ALL_GA,
  ...ALL_TN,
  ...ALL_MI,
  ...ALL_NC,
];

export const SUPPORTED_STATES: { code: StateCode; name: string; tier: "green" | "yellow" }[] = [
  { code: "AL", name: "Alabama",        tier: "green"  },
  { code: "CO", name: "Colorado",       tier: "green"  },
  { code: "FL", name: "Florida",        tier: "yellow" },
  { code: "GA", name: "Georgia",        tier: "yellow" },
  { code: "KS", name: "Kansas",         tier: "green"  },
  { code: "MI", name: "Michigan",       tier: "yellow" },
  { code: "MO", name: "Missouri",       tier: "green"  },
  { code: "NC", name: "North Carolina", tier: "yellow" },
  { code: "OH", name: "Ohio",           tier: "yellow" },
  { code: "SC", name: "South Carolina", tier: "green"  },
  { code: "TN", name: "Tennessee",      tier: "yellow" },
  { code: "TX", name: "Texas",          tier: "yellow" },
  { code: "VA", name: "Virginia",       tier: "green"  },
  { code: "WI", name: "Wisconsin",      tier: "green"  },
  { code: "WV", name: "West Virginia",  tier: "green"  },
];

export function resolveRules(
  stateCode: StateCode,
  effectiveDate: Date = new Date(),
): StateRuleSet | undefined {
  const effective = effectiveDate.toISOString().slice(0, 10);
  return ALL_RULES.find((r) => {
    if (r.stateCode !== stateCode) return false;
    if (r.effectiveFrom > effective) return false;
    if (r.effectiveUntil && r.effectiveUntil <= effective) return false;
    return true;
  });
}

export function decideCompliance(
  stateCode: StateCode,
  strategy: Strategy,
): ComplianceDecision | undefined {
  const ruleSet = resolveRules(stateCode);
  if (!ruleSet) return undefined;

  const warnings: ComplianceWarning[] = [];
  let recommendedFlow: ComplianceDecision["recommendedFlow"] = "standard";
  let attorneyFlagged = false;

  if (strategy === "wholesale") {
    if (!ruleSet.assignmentAllowed) {
      recommendedFlow = "double-close";
      warnings.push({
        severity: "block",
        title: "Direct assignment not permitted",
        body: `${ruleSet.stateName} does not permit direct assignment for wholesale. Default flow switches to double-close via title company.`,
      });
      attorneyFlagged = true;
    } else {
      recommendedFlow = "direct-assignment";
      if (ruleSet.assignmentDisclosureRequired) {
        warnings.push({
          severity: "info",
          title: "Disclosure required",
          body: `${ruleSet.stateName} requires clear disclosure of your intent to assign. We include the required clause in every PSA.`,
        });
      }
      if (ruleSet.sellerConsentRequired) {
        warnings.push({
          severity: "warn",
          title: "Seller consent recommended",
          body: "Best practice: obtain written seller consent to assignment in this state.",
        });
      }
    }
  }

  if (ruleSet.attorneyAtCloseCustomary) {
    warnings.push({
      severity: "info",
      title: "Attorney at close is customary",
      body: `In ${ruleSet.stateName}, it's customary — and recommended — to close with a licensed attorney.`,
    });
  }

  if (ruleSet.confidence !== "high") {
    warnings.push({
      severity: "warn",
      title: "Monitor this state",
      body: `Rule confidence for ${ruleSet.stateName} is ${ruleSet.confidence}. Regulation may change; verify before executing.`,
    });
  }

  return {
    state: stateCode,
    strategy,
    ruleSet,
    recommendedFlow,
    warnings,
    attorneyFlagged,
    generatedAt: new Date().toISOString(),
  };
}

export type {
  ComplianceDecision,
  ComplianceWarning,
  StateCode,
  StateRuleSet,
  Strategy,
} from "./types";
