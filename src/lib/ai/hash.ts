import type { DealSnapshotForAi } from "./types";

export function snapshotHash(snap: DealSnapshotForAi): string {
  const canonical = JSON.stringify(
    Object.keys(snap)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        const v = (snap as Record<string, unknown>)[k];
        if (v !== undefined && v !== null && v !== "") acc[k] = v;
        return acc;
      }, {}),
  );
  let h = 2166136261 >>> 0;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
