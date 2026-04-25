import { SUPPORTED_STATES } from "@/lib/compliance";
import type { StateCode } from "@/lib/compliance/types";

export interface ParsedAddress {
  street?: string;
  city?: string;
  state?: StateCode;
  county?: string;
  zip?: string;
  raw: string;
  warnings: string[];
}

const STATE_CODES = new Set<string>(SUPPORTED_STATES.map((s) => s.code));
const ALL_STATE_NAMES = new Map<string, StateCode>(
  SUPPORTED_STATES.map((s) => [s.name.toLowerCase(), s.code]),
);

const ZIP_RE = /\b(\d{5})(?:-\d{4})?\b/;
const STATE_RE_GLOBAL = /\b([A-Z]{2})\b/g;
// Currency tokens like $269,999 / $1,200.50 / $99 — pasted alongside MLS data.
const CURRENCY_RE = /\$\s?\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\$\s?\d+(?:\.\d{1,2})?/g;

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function parseAddress(raw: string): ParsedAddress {
  const warnings: string[] = [];
  // Drop currency tokens first so they don't confuse comma/digit splitting.
  const stripped = raw.replace(CURRENCY_RE, " ");
  const cleaned = stripped.trim().replace(/\s+/g, " ");
  if (!cleaned) return { raw, warnings: ["Empty address"] };

  let working = cleaned;

  let zip: string | undefined;
  const zipMatch = working.match(ZIP_RE);
  if (zipMatch) {
    zip = zipMatch[1];
    working = working.replace(zipMatch[0], "").trim();
  }

  let state: StateCode | undefined;
  const upper = working.toUpperCase();
  // Scan ALL 2-letter caps tokens, prefer the LAST valid state code
  // (state usually appears near the end, after the city).
  const codeMatches = Array.from(upper.matchAll(STATE_RE_GLOBAL));
  for (let i = codeMatches.length - 1; i >= 0; i--) {
    const m = codeMatches[i];
    if (STATE_CODES.has(m[1])) {
      state = m[1] as StateCode;
      const idx = m.index ?? upper.lastIndexOf(m[1]);
      working = (working.slice(0, idx) + working.slice(idx + 2)).trim();
      break;
    }
  }
  if (!state) {
    for (const [name, code] of ALL_STATE_NAMES) {
      const i = working.toLowerCase().lastIndexOf(name);
      if (i >= 0) {
        state = code;
        working = (working.slice(0, i) + working.slice(i + name.length)).trim();
        break;
      }
    }
  }

  const parts = working
    .split(/[,]+/)
    .map((p) => p.trim().replace(/^[,;.\s]+|[,;.\s]+$/g, ""))
    .filter(Boolean);

  let street: string | undefined;
  let city: string | undefined;

  if (parts.length >= 2) {
    street = parts[0];
    city = parts[parts.length - 1];
  } else if (parts.length === 1) {
    const tokens = parts[0].split(/\s+/);
    const firstDigitIdx = tokens.findIndex((t) => /^\d+$/.test(t));
    if (firstDigitIdx === 0 && tokens.length > 4) {
      const split = Math.max(3, tokens.length - 1);
      street = tokens.slice(0, split).join(" ");
      city = tokens.slice(split).join(" ") || undefined;
    } else {
      street = parts[0];
    }
  }

  street = street ? titleCase(street).replace(/\s+/g, " ").trim().replace(/[,;.]+$/, "") : undefined;
  city = city ? titleCase(city).replace(/[,;.]+$/, "") : undefined;

  if (!street) warnings.push("Couldn't find street");
  if (!city) warnings.push("Couldn't find city");
  if (!state) {
    warnings.push(
      `Couldn't find a supported state (${SUPPORTED_STATES.length} supported)`,
    );
  }
  if (!zip) warnings.push("Couldn't find ZIP");

  return { raw, street, city, state, zip, warnings };
}
