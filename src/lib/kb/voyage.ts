import "server-only";

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY not set");
  if (texts.length === 0) return [];
  if (texts.length > 128) {
    throw new Error("embedBatch: max 128 items per call");
  }
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    throw new Error(`voyage error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as VoyageResponse;
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY not set");
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      input: [text],
      model: MODEL,
      input_type: "query",
    }),
  });
  if (!res.ok) {
    throw new Error(`voyage error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as VoyageResponse;
  return json.data[0].embedding;
}
