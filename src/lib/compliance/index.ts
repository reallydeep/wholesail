import { ALL_OH } from "./rules/oh";
import { ALL_PA } from "./rules/pa";
import { ALL_FL } from "./rules/fl";
import type {
  ComplianceDecision,
  ComplianceWarning,
  StateCode,
  StateRuleSet,
  Strategy,
} from "./types";

const ALL_RULES: StateRuleSet[] = [...ALL_OH, ...ALL_PA, ...ALL_FL];

export const SUPPORTED_STATES: { code: StateCode; name: string }[] = [
  { code: "OH", name: "Ohio" },
  { code: "PA", name: "Pennsylvania" },
  { code: "FL", name: "Florida" },
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
