import Anthropic from "@anthropic-ai/sdk";

export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

export function hasAiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let singleton: Anthropic | null = null;
export function getClient(): Anthropic | null {
  if (!hasAiKey()) return null;
  if (!singleton) {
    singleton = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return singleton;
}

export async function generateJson<T>({
  system,
  user,
  maxTokens = 1024,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T | null> {
  const client = getClient();
  if (!client) return null;
  const res = await client.messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const first = res.content.find((b) => b.type === "text");
  if (!first || first.type !== "text") return null;
  const text = first.text.trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) return null;
  try {
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as T;
  } catch {
    return null;
  }
}
