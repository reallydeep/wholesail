import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { embedQuery } from "./voyage";
import type { StateCode } from "@/lib/compliance/types";

export interface KbHit {
  content: string;
  heading: string | null;
  source_url: string;
  state: string | null;
  similarity: number;
}

export async function retrieveForDeal(opts: {
  state: StateCode | null;
  queryText: string;
  k?: number;
}): Promise<KbHit[]> {
  const k = opts.k ?? 5;
  const queryEmbedding = await embedQuery(opts.queryText);
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc("kb_match", {
    query_embedding: queryEmbedding,
    target_state: opts.state,
    match_count: k,
  });
  if (error) throw new Error(`kb retrieve: ${error.message}`);
  return (data ?? []) as KbHit[];
}
