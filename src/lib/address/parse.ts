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
const STATE_RE = /\b([A-Z]{2})\b/;

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function parseAddress(raw: string): ParsedAddress {
  const warnings: string[] = [];
  const cleaned = raw.trim().replace(/\s+/g, " ");
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
  const stateMatch = upper.match(STATE_RE);
  if (stateMatch && STATE_CODES.has(stateMatch[1])) {
    state = stateMatch[1] as StateCode;
    const idx = upper.lastIndexOf(stateMatch[1]);
    working = (working.slice(0, idx) + working.slice(idx + 2)).trim();
  } else {
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
    .map((p) => p.trim())
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
  if (!state) warnings.push("Couldn't find state (OH, PA, FL only)");
  if (!zip) warnings.push("Couldn't find ZIP");

  return { raw, street, city, state, zip, warnings };
}
