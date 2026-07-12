import { Readability } from "@mozilla/readability";
import { collectMetadata } from "./metadata.js";
import { prepareDom } from "./prepare-dom.js";
import { buildMarkdown } from "./to-markdown.js";
import { formatLocalDate } from "./dates.js";

// Pure extraction pipeline: same code path for the extension (injected
// into the live page) and for Node-based regression tests (jsdom).
// Returns { markdown, meta } on success or { error } on failure.
export function extract(doc, url) {
  try {
    const pageMeta = collectMetadata(doc, url);
    const clone = doc.cloneNode(true);
    prepareDom(clone, url);

    const article = new Readability(clone).parse();
    if (!article || !article.content || !article.content.trim()) {
      return { error: "no-content" };
    }

    const meta = {
      title: firstNonEmpty(article.title, pageMeta.ogTitle, doc.title) || "",
      sourceUrl: pageMeta.sourceUrl,
      author: firstNonEmpty(pageMeta.author, article.byline),
      published: pageMeta.published,
      clipped: formatLocalDate(new Date()),
      language: pageMeta.language,
    };

    return { markdown: buildMarkdown(meta, article.content), meta };
  } catch (error) {
    return { error: String((error && error.message) || error) };
  }
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}
