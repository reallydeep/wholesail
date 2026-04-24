export interface Chunk {
  text: string;
  heading: string | null;
}

function charsForTokens(t: number): number {
  return t * 4;
}

function splitOversizedBlock(text: string, target: number): string[] {
  if (text.length <= target) return [text];
  const parts: string[] = [];
  // Split on sentence boundaries when possible
  const sentences = text.split(/(?<=[.!?])\s+/);
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length + 1 > target && buf.length > 0) {
      parts.push(buf.trim());
      buf = s;
    } else {
      buf = buf ? buf + " " + s : s;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  // Final fallback: hard-split any part still exceeding target
  const out: string[] = [];
  for (const p of parts) {
    if (p.length <= target) {
      out.push(p);
    } else {
      for (let i = 0; i < p.length; i += target) {
        out.push(p.slice(i, i + target));
      }
    }
  }
  return out;
}

export function chunkMarkdown(
  md: string,
  opts: { targetTokens: number; overlapTokens: number },
): Chunk[] {
  const target = charsForTokens(opts.targetTokens);
  const overlap = charsForTokens(opts.overlapTokens);

  const blocks = md.split(/\n\s*\n/);
  const withHeading: { text: string; heading: string | null }[] = [];
  let heading: string | null = null;
  for (const block of blocks) {
    const h = block.match(/^#{1,6}\s+(.+)$/m);
    if (h) heading = h[1].trim();
    const trimmed = block.trim();
    if (!trimmed) continue;
    for (const piece of splitOversizedBlock(trimmed, target)) {
      withHeading.push({ text: piece, heading });
    }
  }

  const chunks: Chunk[] = [];
  let buf = "";
  let bufHeading: string | null = null;
  for (const { text, heading: h } of withHeading) {
    if (buf.length + text.length + 2 > target && buf.length > 0) {
      chunks.push({ text: buf.trim(), heading: bufHeading });
      const tail = buf.slice(-overlap);
      buf = tail + "\n\n" + text;
      bufHeading = h;
    } else {
      buf = buf ? buf + "\n\n" + text : text;
      bufHeading = bufHeading ?? h;
    }
  }
  if (buf.trim()) chunks.push({ text: buf.trim(), heading: bufHeading });
  return chunks;
}
