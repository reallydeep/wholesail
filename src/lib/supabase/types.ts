import type { StateCode } from "@/lib/compliance/types";

export type Plan = "trialing" | "scout" | "operator" | "firm" | "canceled";
export type Role = "owner" | "admin" | "member";

export interface FirmRow {
  id: string;
  name: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  state_scope: StateCode[];
  created_at: string;
  updated_at: string;
}

export interface MembershipRow {
  firm_id: string;
  user_id: string;
  role: Role;
  created_at: string;
}

export interface DealRow {
  id: string;
  firm_id: string;
  state: StateCode | null;
  status: string;
  draft: unknown;
  analysis: unknown;
  ai_narrative: unknown;
  snapshot_hash: string | null;
  updated_at: string;
  created_at: string;
}
