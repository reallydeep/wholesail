// URL-safe random token for signing links. ~22 chars of base64url
// (≈132 bits of entropy) — long enough to be unguessable, short enough
// to fit in a copy-pasted SMS link.

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function generateSigningToken(byteLength = 16): string {
  if (byteLength < 8) throw new Error("token too short");
  const bytes = new Uint8Array(byteLength);
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += ALPHABET[bytes[i] & 0x3f];
  }
  return out;
}

export function isLikelySigningToken(s: string): boolean {
  return /^[A-Za-z0-9_-]{16,64}$/.test(s);
}
