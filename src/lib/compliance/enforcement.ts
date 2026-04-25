import type { StateCode } from "./types";

export type DisclosureCode = "OH_SB131" | "FL_HB1049";

export interface DisclosureAck {
  code: DisclosureCode;
  at: string;
}

export interface EnforcementDeal {
  state?: StateCode;
  contractAt?: string;
  disclosuresAck?: DisclosureAck[];
}

export const FL_COOLDOWN_HOURS = 72;

export function requiresContractDisclosure(
  state: StateCode | undefined,
): DisclosureCode | null {
  if (state === "OH") return "OH_SB131";
  return null;
}

export function isAckedFor(
  deal: EnforcementDeal,
  code: DisclosureCode,
): boolean {
  return (deal.disclosuresAck ?? []).some((a) => a.code === code);
}

export function flCooldownExpiresAt(deal: EnforcementDeal): string | null {
  if (deal.state !== "FL") return null;
  if (!deal.contractAt) return null;
  const ms = new Date(deal.contractAt).getTime() + FL_COOLDOWN_HOURS * 3600_000;
  return new Date(ms).toISOString();
}

export interface SendGate {
  ok: boolean;
  reason?: string;
  unlocksAt?: string;
}

export function canSendToBuyer(
  deal: EnforcementDeal,
  now: Date = new Date(),
): SendGate {
  const unlocksAt = flCooldownExpiresAt(deal);
  if (!unlocksAt) return { ok: true };
  if (now.getTime() >= new Date(unlocksAt).getTime()) return { ok: true };
  return {
    ok: false,
    reason: "FL HB1049 — 72-hour cooldown active",
    unlocksAt,
  };
}
