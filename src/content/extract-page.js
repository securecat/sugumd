import Defuddle from "defuddle";
import { collectMetadata } from "./metadata.js";
import { prepareDom } from "./prepare-dom.js";
import { buildMarkdown } from "./to-markdown.js";
import { formatLocalDate, normalizeDate } from "./dates.js";

// Pure extraction pipeline: same code path for the extension (injected
// into the live page) and for Node-based regression tests (linkedom).
// Returns { markdown, meta } on success or { error } on failure.
//
// url is the document's own URL (base for resolving relative URLs).
// sourceUrl is what goes into the frontmatter; it differs from url only
// when extracting from a frame document (then it is the top page URL).
export function extract(doc, url, sourceUrl = url) {
  try {
    const pageMeta = collectMetadata(doc, url, sourceUrl);
    // Defuddle's parse() works on (and mutates) the document it is given,
    // so hand it a clone — never the live page.
    const clone = doc.cloneNode(true);
    prepareDom(clone, url);

    const article = new Defuddle(clone, { url }).parse();
    if (!article || !article.content || !article.content.trim()) {
      return { error: "no-content" };
    }

    const meta = {
      title: stripSiteSuffix(
        firstNonEmpty(article.title, pageMeta.ogTitle, doc.title) || "",
        article.site
      ),
      sourceUrl: pageMeta.sourceUrl,
      author: firstNonEmpty(article.author, pageMeta.author),
      published: normalizeDate(article.published) || pageMeta.published,
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

// Drop a trailing "separator + site name" from the title (e.g.
// "記事タイトル：朝日新聞"). Driven by the site name Defuddle extracts, not
// by any site-specific rule. Without a separator the site name is treated
// as part of the title and kept.
export function stripSiteSuffix(title, site) {
  if (!title || !site || typeof site !== "string") return title;
  const t = title.trim();
  const s = site.trim();
  if (!s || t === s || !t.toLowerCase().endsWith(s.toLowerCase())) return title;

  const head = t.slice(0, t.length - s.length);
  const separator = head.match(/\s*[：:｜|‐–—―\-・~〜»›]+\s*$/);
  if (!separator || !separator[0]) return title;

  const stripped = head.slice(0, head.length - separator[0].length).trim();
  return stripped || title;
}
