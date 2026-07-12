import { Readability } from "@mozilla/readability";
import { collectMetadata } from "./metadata.js";
import { prepareDom } from "./prepare-dom.js";
import { buildMarkdown } from "./to-markdown.js";
import { formatLocalDate } from "./dates.js";

export function extractPage(doc, loc) {
  try {
    const meta = collectMetadata(doc, loc);
    const clone = doc.cloneNode(true);
    prepareDom(clone, loc.href);

    const article = new Readability(clone).parse();
    if (!article || !article.content || !article.content.trim()) {
      return { ok: false, reason: "no-content" };
    }

    const title = firstNonEmpty(article.title, meta.ogTitle, doc.title) || "";
    const author = firstNonEmpty(meta.author, article.byline);
    const clipped = formatLocalDate(new Date());

    const markdown = buildMarkdown(
      {
        title,
        sourceUrl: meta.sourceUrl,
        author,
        published: meta.published,
        clipped,
        language: meta.language,
      },
      article.content
    );

    return { ok: true, markdown, title, clipped };
  } catch (error) {
    return { ok: false, reason: String((error && error.message) || error) };
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
