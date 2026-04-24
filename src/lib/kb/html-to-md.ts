export function htmlToMarkdown(html: string): string {
  let s = html;
  s = s.replace(/<head[\s\S]*?<\/head>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  const mainMatch = s.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) s = mainMatch[0];
  for (let lvl = 6; lvl >= 1; lvl--) {
    const hashes = "#".repeat(lvl);
    s = s.replace(
      new RegExp(`<h${lvl}[^>]*>([\\s\\S]*?)<\\/h${lvl}>`, "gi"),
      `\n\n${hashes} $1\n\n`,
    );
  }
  s = s.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n");
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  s = s.replace(/<\/(ul|ol)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
