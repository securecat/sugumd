import { prepareImages } from "./resolve-image-url.js";

// Text longer than this inside an image link is treated as real link text,
// not a caption, and the anchor is left alone.
const CAPTION_MAX_LENGTH = 80;

// Pre-clean the cloned document so the extraction engine doesn't throw
// away images that are actually part of the article, and so page chrome
// the engine keeps doesn't leak into the clip.
export function prepareDom(doc, baseUrl) {
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
// a Markdown clip and pollute it. Still needed with Defuddle: its
// selector-based cleanup catches many real-world share widgets, but not
// print-excluded classes (notPrint etc.), bare <button>s, script-only
// anchor controls, or all of these share endpoints.
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

// Japanese news sites drop "see also" teaser links like 【写真】… /
// 【動画】… into the middle of body paragraphs. They are pure navigation.
// Still needed with Defuddle: the engine keeps them as body text (with
// Readability they were worse — their link density took the lead
// paragraph and lead image down with them).
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

// News sites (e.g. Yahoo! News) wrap article photos in a link to a photo
// page, caption included, in plain <div>s. The extraction engine drops
// such all-link blocks (verified: Defuddle also loses Yahoo's article
// images without this). Replace those anchors with <figure><img>
// (+ <figcaption> when the link text looks like a caption).
//
// Still needed with Defuddle. The isSelfOrImageLink guard is also kept:
// it is not an engine workaround but the semantic scope of the feature —
// only photo-viewer/lightbox links are article figures. Rescuing anchors
// that lead to OTHER pages would promote navigation cards (rankings,
// related-article thumbnails) into protected figures and shield them
// from the engine's cleanup.
function rescueLinkedImages(doc, baseUrl) {
  for (const anchor of doc.querySelectorAll("a")) {
    const imgs = anchor.querySelectorAll("img");
    if (imgs.length !== 1) continue;
    const text = (anchor.textContent || "").replace(/\s+/g, " ").trim();
    if (text.length > CAPTION_MAX_LENGTH) continue;
    if (anchor.closest("figure")) continue;
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
