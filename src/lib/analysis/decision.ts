import type {
  AnalysisInput,
  AnalysisResult,
  DecisionScore,
  Flag,
  FlipResult,
  HoldResult,
  RepairEstimate,
  WholesaleResult,
} from "./types";

interface Inputs {
  input: AnalysisInput;
  repair: RepairEstimate;
  wholesale?: WholesaleResult;
  flip?: FlipResult;
  hold?: HoldResult;
}

export function decide({
  input,
  repair,
  wholesale,
  flip,
  hold,
}: Inputs): Pick<AnalysisResult, "decision" | "reasons" | "flags"> {
  const flags: Flag[] = [];
  const reasons: string[] = [];

  // ── Hard flags (deal killers) ─────────────────────────────
  const notes = (input.repairNotes ?? "").toLowerCase();
  const titleTerms = ["lien", "probate", "tax sale", "foreclosure auction"];
  for (const t of titleTerms) {
    if (notes.includes(t)) {
      flags.push({
        code: "title-concern",
        severity: "hard",
        message: `Repair notes reference "${t}" — verify title before pursuing.`,
      });
    }
  }

  if (input.strategy === "wholesale" && wholesale) {
    const askingVsArv = input.askingPriceCents / input.arvCents;
    if (askingVsArv > 0.85) {
      flags.push({
        code: "asking-too-high",
        severity: "hard",
        message: `Asking is ${(askingVsArv * 100).toFixed(0)}% of ARV — wholesale math won't work.`,
      });
    }
  }

  if (repair.tier === "high" && input.strategy === "flip" && flip) {
    if (flip.netMarginPct < 25) {
      flags.push({
        code: "high-repair-thin-margin",
        severity: "hard",
        message: `Heavy rehab with ${flip.netMarginPct.toFixed(1)}% margin — below 25% threshold.`,
      });
    }
  }

  if (input.occupancy === "tenant" && input.strategy === "wholesale") {
    flags.push({
      code: "tenant-occupied",
      severity: "soft",
      message: "Tenant-occupied — confirm tenant notice requirements in your state.",
    });
  }

  // ── Build reasons (positive or negative, top 3) ───────────
  if (input.strategy === "wholesale" && wholesale) {
    if (wholesale.profitSpreadCents >= 0) {
      const spreadDollars = Math.round(wholesale.profitSpreadCents / 100);
      reasons.push(
        `Asking is $${spreadDollars.toLocaleString()} below MAO — room to offer lower.`,
      );
    } else {
      const gapDollars = Math.round(Math.abs(wholesale.profitSpreadCents) / 100);
      reasons.push(
        `Asking is $${gapDollars.toLocaleString()} above MAO — counter below that.`,
      );
    }
  }

  if (input.strategy === "flip" && flip) {
    const net = Math.round(flip.netProfitCents / 100);
    reasons.push(
      `Projected net profit $${net.toLocaleString()} (${flip.netMarginPct.toFixed(1)}% of ARV).`,
    );
  }

  if (input.strategy === "hold" && hold) {
    reasons.push(
      `Cap rate ${hold.capRatePct.toFixed(1)}%, cash-on-cash ${hold.cashOnCashPct.toFixed(1)}%.`,
    );
  }

  // Repair tier reason
  reasons.push(
    `Repair tier ${repair.tier.toUpperCase()}${
      repair.keywordHits.length > 0
        ? ` — flagged by: ${repair.keywordHits.slice(0, 3).join(", ")}`
        : ""
    }.`,
  );

  // Motivation + timeline
  if (input.sellerMotivation >= 4) {
    reasons.push(
      `Seller motivation ${input.sellerMotivation}/5${input.timelineUrgencyDays ? `, ${input.timelineUrgencyDays}-day close window` : ""} — negotiating leverage.`,
    );
  } else if (input.sellerMotivation <= 2) {
    reasons.push(
      `Seller motivation only ${input.sellerMotivation}/5 — limited leverage.`,
    );
  }

  // ── Decision ───────────────────────────────────────────────
  const hasHardFlag = flags.some((f) => f.severity === "hard");

  let thresholdMet = false;
  if (input.strategy === "wholesale" && wholesale)
    thresholdMet = wholesale.meetsThresholds;
  if (input.strategy === "flip" && flip) thresholdMet = flip.meetsThresholds;
  if (input.strategy === "hold" && hold) thresholdMet = hold.meetsThresholds;

  let decision: DecisionScore;
  if (hasHardFlag) {
    decision = "pass";
  } else if (thresholdMet && flags.length === 0) {
    decision = "pursue";
  } else if (thresholdMet) {
    decision = "review"; // passes math but has soft flags
  } else {
    decision = "review";
  }

  // If the math clearly misses by a wide margin, push to pass
  if (input.strategy === "wholesale" && wholesale) {
    const missPct =
      wholesale.profitSpreadCents / Math.max(input.arvCents, 1);
    if (missPct < -0.1) decision = "pass";
  }
  if (input.strategy === "flip" && flip) {
    if (flip.netMarginPct < 5) decision = "pass";
  }

  return {
    decision,
    reasons: reasons.slice(0, 3),
    flags,
  };
}
