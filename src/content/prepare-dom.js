import { prepareImages } from "./resolve-image-url.js";

// Text longer than this inside an image link is treated as real link text,
// not a caption, and the anchor is left alone.
const CAPTION_MAX_LENGTH = 80;

// Pre-clean the cloned document so Readability doesn't throw away images
// that are actually part of the article.
export function prepareDom(doc, baseUrl) {
  isolateSingleArticle(doc);
  stripMisleadingClassTokens(doc);
  removeUiChrome(doc);
  removePromoLinks(doc);
  removeAdMarkers(doc);
  prepareImages(doc, baseUrl);
  rescueLinkedImages(doc, baseUrl);
}

// Class tokens that mean "exclude from print" — the site itself says this
// is page chrome, not content (asahi.com "notPrint", Bootstrap
// "d-print-none", etc.).
const PRINT_HIDDEN_CLASS = /^(no-?print|not-?print|d-print-none|print-(none|hidden)|hidden-print)$/i;

// Share endpoints. "mailto:?" (no recipient) is the share-by-mail form —
// its subject/body parameters can embed the whole article as one giant
// URL. Plain "mailto:someone@…" contact links are kept.
const SHARE_HREF = new RegExp(
  [
    "^mailto:\\?",
    "(?:twitter|x)\\.com/intent/",
    "facebook\\.com/(?:sharer|share\\.php|dialog/(?:feed|share))",
    "b\\.hatena\\.ne\\.jp/(?:add|entry/panel)",
    "line\\.me/R/msg/",
    "social-plugins\\.line\\.me/lineit/share",
    "getpocket\\.com/(?:save|edit)",
    "linkedin\\.com/(?:shareArticle|sharing/share-offsite)",
    "pinterest\\.com/pin/create",
    "reddit\\.com/submit",
    "t\\.me/share",
    "wa\\.me/\\?text=",
    "api\\.whatsapp\\.com/send",
    "weibo\\.com/share",
    "news\\.ycombinator\\.com/submitlink",
  ].join("|"),
  "i"
);

// Print/share toolbars and other interactive controls are meaningless in
// a Markdown clip and pollute it (Readability keeps them when they sit
// inside the content container).
function removeUiChrome(doc) {
  for (const el of doc.querySelectorAll("[class]")) {
    const tokens = (el.getAttribute("class") || "").split(/\s+/);
    if (tokens.some((t) => PRINT_HIDDEN_CLASS.test(t))) removeAndPruneUp(el);
  }
  for (const anchor of doc.querySelectorAll("a")) {
    const href = (anchor.getAttribute("href") || "").trim();
    const scriptOnly = href.toLowerCase().startsWith("javascript:") ||
      (!href && anchor.getAttribute("role") === "button");
    if (scriptOnly || (href && SHARE_HREF.test(href))) removeAndPruneUp(anchor);
  }
  for (const button of doc.querySelectorAll("button")) removeAndPruneUp(button);
}

const PRUNABLE_TAGS = new Set(["LI", "UL", "OL", "DIV", "P", "SPAN", "SECTION", "NAV"]);

// Remove an element, then climb and remove wrappers left with nothing in
// them, so lists of share buttons don't leave empty bullet skeletons.
function removeAndPruneUp(el) {
  let parent = el.parentElement;
  el.remove();
  while (
    parent &&
    PRUNABLE_TAGS.has(parent.nodeName) &&
    !(parent.textContent || "").trim() &&
    !parent.querySelector("img")
  ) {
    const next = parent.parentElement;
    parent.remove();
    parent = next;
  }
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

// Ad markers like [PR] survive Readability (its ad-word list doesn't know
// them) and end up as stray paragraphs at the top of the clip.
const AD_MARKER_TEXT = /^(\[?(PR|AD)\]?|広告|スポンサーリンク)$/i;

function removeAdMarkers(doc) {
  for (const el of doc.querySelectorAll("p, div, span")) {
    if (el.querySelector("img")) continue;
    if (AD_MARKER_TEXT.test((el.textContent || "").trim())) el.remove();
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
    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > CAPTION_MAX_LENGTH) continue;

    if (anchor.closest("figure")) {
      // Inside a real <figure> the site itself declares this an article
      // figure, so the link (photo viewer, lightbox — wherever it goes)
      // can be unwrapped unconditionally. Keep all children: some sites
      // (e.g. asahi.com) put the <figcaption> inside the anchor too.
      anchor.replaceWith(...anchor.childNodes);
      continue;
    }
    if (!isSelfOrImageLink(anchor.getAttribute("href"), baseUrl)) continue;

    const figure = doc.createElement("figure");
    figure.appendChild(imgs[0]);
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
