import type { AiAnalysisNarrative, AiDocDraft, DealSnapshotForAi } from "./types";
import { snapshotHash } from "./hash";

function money(cents?: number): string {
  if (cents == null) return "—";
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

export function fallbackNarrative(snap: DealSnapshotForAi): AiAnalysisNarrative {
  const addr = [snap.address, snap.city, snap.state].filter(Boolean).join(", ") || "This property";
  const strat = snap.strategy ?? "wholesale";
  const opportunities: string[] = [];
  const risks: string[] = [];
  const negotiation: string[] = [];

  if (strat === "wholesale" && snap.spreadCents != null) {
    if (snap.spreadCents > 0) {
      opportunities.push(
        `Asking sits ${money(snap.spreadCents)} below MAO — there is room to offer lower without killing the assignment.`,
      );
    } else {
      risks.push(
        `Asking is ${money(Math.abs(snap.spreadCents))} above MAO — you need a concession or an ARV lift.`,
      );
      negotiation.push(
        `Lead with repair tier (${snap.repairTier ?? "?"}) and the MAO math. Anchor at ${money(snap.maoCents)}.`,
      );
    }
  }

  if (strat === "flip" && snap.netMarginPct != null) {
    if (snap.netMarginPct >= 0.15) {
      opportunities.push(
        `Projected margin of ${(snap.netMarginPct * 100).toFixed(1)}% clears the 15% threshold — viable flip.`,
      );
    } else {
      risks.push(
        `Margin of ${(snap.netMarginPct * 100).toFixed(1)}% is thin. A single holding-cost surprise erases the profit.`,
      );
    }
  }

  if (strat === "hold" && snap.capRatePct != null) {
    if (snap.capRatePct >= 0.08) {
      opportunities.push(
        `Cap rate ${(snap.capRatePct * 100).toFixed(2)}% — holds the yield you want in ${snap.state ?? "market"}.`,
      );
    } else {
      risks.push(
        `Cap rate ${(snap.capRatePct * 100).toFixed(2)}% is below 8%. Check if rents have room to push.`,
      );
    }
  }

  if (snap.repairTier === "high") {
    risks.push("Heavy repair tier — scope mechanicals and foundation before hard money commits.");
  }
  if ((snap.sellerMotivation ?? 0) >= 4) {
    opportunities.push("Seller motivation is high — lean on a short close window in the offer.");
    negotiation.push("Offer a 14-day close with 1% earnest money to lock it before competitors circle.");
  }
  if (snap.occupancy === "tenant") {
    risks.push("Tenant-occupied — confirm lease terms and state notice requirements before contract.");
  }

  if (opportunities.length === 0) {
    opportunities.push("Numbers line up against stated thresholds. Verify with recent comps.");
  }
  if (risks.length === 0) {
    risks.push("No hard flags surfaced. Confirm title and ownership before submitting paper.");
  }
  if (negotiation.length === 0) {
    negotiation.push("Open with the highest price you can defend with comps — leave headroom for inspection concessions.");
  }

  return {
    headline: `${strat.toUpperCase()} read on ${addr}`,
    thesis: `Using the inputs captured, this ${strat} read stamps a ${
      snap.decision?.toUpperCase() ?? "REVIEW"
    }. Below is a deterministic read; connect an API key for a full AI second-opinion.`,
    opportunities,
    risks,
    negotiation,
    source: "deterministic",
    generatedAt: new Date().toISOString(),
    inputHash: snapshotHash(snap),
  };
}

export function fallbackDoc(
  kind: AiDocDraft["kind"],
  snap: DealSnapshotForAi,
): AiDocDraft {
  const addr = [snap.address, snap.city, snap.state, snap.zip].filter(Boolean).join(", ");
  const price = money(snap.askingPriceCents);
  const arv = money(snap.arvCents);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const templates: Record<AiDocDraft["kind"], { title: string; body: string }> = {
    "cover-letter": {
      title: "Cover letter",
      body: `${today}\n\nRE: ${addr || "[Property address]"}\n\nTo the seller,\n\nThank you for considering our offer. We are prepared to move quickly on ${addr || "this property"} at a purchase price of ${price}, with flexibility on the closing window to match your timeline.\n\nWe close ${price} deals cleanly — earnest money is wired same day, inspection period is limited, and our title company is standing by. The enclosed offer reflects our best read of the property's after-repair value at ${arv}.\n\nWe look forward to working together.\n\nSincerely,\n[Buyer name]\n[Entity · Phone · Email]`,
    },
    "market-memo": {
      title: "Market memo",
      body: `MARKET MEMO · ${today}\n\nSubject property: ${addr || "[Address]"}\nStrategy: ${snap.strategy?.toUpperCase() ?? "—"}\nTarget exit: ${arv}\n\nMarket read (template — connect API key for live comps):\n· Submarket absorption is steady for ${snap.beds ?? "?"}bd / ${snap.baths ?? "?"}ba product.\n· Days on market in ${snap.zip ?? "this ZIP"} have been trending consistent with metro average.\n· Recent sales at or above ARV support the exit assumption, pending direct comp pull.\n\nRepair exposure: ${snap.repairTier?.toUpperCase() ?? "—"} tier, mid-estimate ${money(snap.repairMidCents)}.\nDecision: ${snap.decision?.toUpperCase() ?? "REVIEW"}\n\n— Wholesail desk`,
    },
    "seller-outreach": {
      title: "Seller outreach note",
      body: `Hi —\n\nMy team has been looking at ${snap.city ?? "your area"} and ${addr || "your property"} caught my eye. We close cash, on your timeline, without the showings and repairs a listing would demand.\n\nIf you're open to a direct conversation about a simple, no-obligation number, I can have an offer in front of you within 48 hours.\n\nIt costs nothing to hear what we'd pay.\n\n— [Buyer name]`,
    },
    "buyer-brief": {
      title: "Assignment — buyer brief",
      body: `ASSIGNMENT OPPORTUNITY\n\nAddress: ${addr || "[Address]"}\nContract price: ${price}\nAfter-repair value: ${arv}\nAssignment fee: ${money(snap.assignmentFeeCents)}\n\nFacts: ${snap.beds ?? "?"}bd / ${snap.baths ?? "?"}ba · ${snap.sqft?.toLocaleString() ?? "?"} sqft · built ${snap.yearBuilt ?? "?"}\nOccupancy: ${snap.occupancy ?? "—"}\nRepair tier: ${snap.repairTier?.toUpperCase() ?? "—"}, mid ${money(snap.repairMidCents)}\n\nWhy it works:\n· Spread of ${money(snap.spreadCents)} between MAO and asking (wholesale math only).\n· Motivated seller, ${snap.timelineUrgencyDays ?? "?"}-day close target.\n\nClosing logistics by separate cover.\n\n— Wholesail desk`,
    },
  };

  const t = templates[kind];
  return {
    kind,
    title: t.title,
    body: t.body,
    source: "deterministic",
    generatedAt: new Date().toISOString(),
    inputHash: snapshotHash(snap),
  };
}
