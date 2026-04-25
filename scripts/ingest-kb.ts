import { config } from "dotenv";
config({ path: ".env.local" });

import { ingestAll } from "@/lib/kb/ingest";

async function main() {
  console.log("Starting KB ingest...");
  const results = await ingestAll();
  for (const r of results) {
    if (r.error) {
      console.error(`✗ ${r.source}: ${r.error}`);
    } else {
      console.log(`✓ ${r.source}: ${r.chunksWritten} chunks`);
    }
  }
  const total = results.reduce((sum, r) => sum + r.chunksWritten, 0);
  console.log(
    `\nTotal: ${total} chunks written across ${results.length} sources.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
