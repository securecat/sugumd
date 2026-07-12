import { prepareImages } from "./resolve-image-url.js";

// Text longer than this inside an image link is treated as real link text,
// not a caption, and the anchor is left alone.
const CAPTION_MAX_LENGTH = 80;

// Pre-clean the cloned document so Readability doesn't throw away images
// that are actually part of the article.
export function prepareDom(doc, baseUrl) {
  isolateSingleArticle(doc);
  stripMisleadingClassTokens(doc);
  removePromoLinks(doc);
  prepareImages(doc, baseUrl);
  rescueLinkedImages(doc, baseUrl);
}

// Minimum amount of text (whitespace removed) for an <article> element to
// be trusted as the page's main content.
const ARTICLE_MIN_TEXT = 250;

// Some sites (e.g. Yahoo! News) put rankings and other sidebar modules in
// plain <div>s inside <main> — not <aside> — so Readability can't tell
// them apart from the body, and on short articles the sidebar can win.
// When the page has exactly one substantial <article>, semantic HTML
// already tells us where the content is: reduce the document to it.
function isolateSingleArticle(doc) {
  const articles = doc.querySelectorAll("article");
  if (articles.length !== 1) return;
  const article = articles[0];
  const textLength = (article.textContent || "").replace(/\s+/g, "").length;
  if (textLength < ARTICLE_MIN_TEXT) return;
  if (!doc.body || !doc.body.contains(article)) return;
  doc.body.textContent = "";
  doc.body.appendChild(article);
}

// Japanese news sites drop "see also" teaser links like 【写真】… /
// 【動画】… into the middle of body paragraphs. They are pure navigation,
// and their text raises the block's link density enough for Readability to
// delete the whole block — lead paragraph and lead image included.
const PROMO_LINK_TEXT = /^【(?:写真|画像|動画|図解|図表|グラフ|地図|一覧|関連)/;

function removePromoLinks(doc) {
  for (const anchor of doc.querySelectorAll("a")) {
    if (anchor.querySelector("img")) continue;
    if (PROMO_LINK_TEXT.test((anchor.textContent || "").trim())) anchor.remove();
  }
}

// Utility classes like "overflow-x-hidden" (Tailwind and friends) match
// Readability's negative "hidden" heuristic and get the whole element
// removed even though nothing is visually hidden. Drop just those tokens;
// genuine "hidden" / "is-hidden" classes keep their meaning.
function stripMisleadingClassTokens(doc) {
  for (const el of doc.querySelectorAll("[class*='hidden' i]")) {
    const tokens = (el.getAttribute("class") || "").split(/\s+/);
    const kept = tokens.filter((t) => !(/overflow/i.test(t) && /hidden/i.test(t)));
    if (kept.length !== tokens.length) el.setAttribute("class", kept.join(" "));
  }
}

// News sites (e.g. Yahoo! News) wrap article photos in a link to a photo
// page, caption included. Readability sees a block whose text is 100%
// links and removes it. Replace such anchors with <figure><img>
// (+ <figcaption> when the link text looks like a caption) — <figure> is
// exempt from Readability's conditional cleanup, and the link itself is
// worthless in a clip.
//
// Only anchors that point at an image file or back into the current page
// (photo viewer, lightbox) are rescued. Navigation cards that link to
// OTHER pages (rankings, related articles) must stay links: their high
// link density is exactly what makes Readability discard those blocks,
// and neutralizing it can get a sidebar picked as the article body.
function rescueLinkedImages(doc, baseUrl) {
  for (const anchor of doc.querySelectorAll("a")) {
    const imgs = anchor.querySelectorAll("img");
    if (imgs.length !== 1) continue;
    if (!isSelfOrImageLink(anchor.getAttribute("href"), baseUrl)) continue;
    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > CAPTION_MAX_LENGTH) continue;

    const img = imgs[0];
    if (anchor.closest("figure")) {
      // Already inside a real figure; just unwrap the link.
      anchor.replaceWith(img);
      continue;
    }
    const figure = doc.createElement("figure");
    figure.appendChild(img);
    if (text) {
      const figcaption = doc.createElement("figcaption");
      figcaption.textContent = text;
      figure.appendChild(figcaption);
    }
    anchor.replaceWith(figure);
  }
}

function isSelfOrImageLink(href, baseUrl) {
  if (!href || href.trim() === "" || href.trim() === "#") return true;
  let target;
  let page;
  try {
    target = new URL(href, baseUrl);
    page = new URL(baseUrl);
  } catch {
    return false;
  }
  if (/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(target.pathname)) return true;
  // Same page, or a sub-path of it (e.g. <article-url>/images/000).
  const pagePath = page.origin + page.pathname.replace(/\/$/, "");
  const targetPath = target.origin + target.pathname.replace(/\/$/, "");
  return targetPath === pagePath || targetPath.startsWith(`${pagePath}/`);
}
