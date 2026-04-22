"use client";

import * as React from "react";
import type { DealDraft } from "./types";

const STORAGE_KEY = "wholesail:draft:v1";
const EVENT_NAME = "wholesail:draft-changed";

function readDraft(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT_NAME, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT_NAME, cb);
    window.removeEventListener("storage", cb);
  };
}

function writeDraft(raw: string) {
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(EVENT_NAME));
}

function clearDraft() {
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useDraft(): {
  draft: DealDraft;
  patch: (p: Partial<DealDraft>) => void;
  reset: () => void;
} {
  const raw = React.useSyncExternalStore(
    subscribe,
    readDraft,
    () => "", // server snapshot: empty
  );

  const draft = React.useMemo<DealDraft>(() => {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as DealDraft;
    } catch {
      return {};
    }
  }, [raw]);

  const patch = React.useCallback(
    (p: Partial<DealDraft>) => {
      const next = { ...draft, ...p };
      writeDraft(JSON.stringify(next));
    },
    [draft],
  );

  const reset = React.useCallback(() => {
    clearDraft();
  }, []);

  return { draft, patch, reset };
}
