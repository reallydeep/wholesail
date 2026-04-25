import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { embedBatch } from "./voyage";
import { chunkMarkdown } from "./chunk";
import { htmlToMarkdown } from "./html-to-md";
import { KB_SOURCES, type KbSource } from "./sources";

export interface IngestResult {
  source: string;
  chunksWritten: number;
  error?: string;
}

export async function ingestSource(source: KbSource): Promise<IngestResult> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "WholesailKB/1.0" },
    });
    if (!res.ok) {
      return {
        source: source.url,
        chunksWritten: 0,
        error: `fetch ${res.status}`,
      };
    }
    const html = await res.text();
    const md = htmlToMarkdown(html);
    const chunks = chunkMarkdown(md, {
      targetTokens: 500,
      overlapTokens: 50,
    });
    if (chunks.length === 0) {
      return { source: source.url, chunksWritten: 0 };
    }
    const embeddings = await embedBatch(chunks.map((c) => c.text));
    const admin = supabaseAdmin();
    const rows = chunks.map((c, i) => ({
      state: source.state === "ALL" ? null : source.state,
      section: source.section,
      heading: c.heading,
      source_url: source.url,
      content: c.text,
      embedding: embeddings[i],
      verified_at: new Date().toISOString(),
    }));
    await admin.from("kb_chunks").delete().eq("source_url", source.url);
    const { error } = await admin.from("kb_chunks").insert(rows);
    if (error) {
      return { source: source.url, chunksWritten: 0, error: error.message };
    }
    return { source: source.url, chunksWritten: rows.length };
  } catch (e) {
    return {
      source: source.url,
      chunksWritten: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function ingestAll(): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (const source of KB_SOURCES) {
    results.push(await ingestSource(source));
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}
