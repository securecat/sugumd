import { normalizeDate } from "./dates.js";

const TRACKING_PARAMS = /^(fbclid|gclid|yclid|igshid)$/i;

export function collectMetadata(doc, url, sourceUrl = url) {
  const jsonLd = findArticleJsonLd(doc);
  return {
    ogTitle: metaContent(doc, 'meta[property="og:title"]'),
    published: findPublished(doc, jsonLd),
    author: findAuthor(doc, jsonLd),
    language: findLanguage(doc),
    sourceUrl: cleanSourceUrl(sourceUrl),
  };
}

function metaContent(doc, selector) {
  const el = doc.querySelector(selector);
  const content = el && el.getAttribute("content");
  return content ? content.trim() : null;
}

function findPublished(doc, jsonLd) {
  const metaTime = metaContent(doc, 'meta[property="article:published_time"]');
  if (metaTime) {
    const date = normalizeDate(metaTime);
    if (date) return date;
  }
  for (const node of jsonLd) {
    if (node.datePublished) {
      const date = normalizeDate(node.datePublished);
      if (date) return date;
    }
  }
  const timeEl = findFirstTime(doc);
  if (timeEl) return normalizeDate(timeEl.getAttribute("datetime"));
  return null;
}

// Prefer <time> elements near the article header over ones elsewhere
// (footers, sidebars) by narrowing the scope selector by selector.
function findFirstTime(doc) {
  const scopes = [
    "article time[datetime]",
    "header time[datetime]",
    "main time[datetime]",
    "time[datetime]",
  ];
  for (const selector of scopes) {
    const el = doc.querySelector(selector);
    if (el) return el;
  }
  return null;
}

function findAuthor(doc, jsonLd) {
  for (const node of jsonLd) {
    const name = authorName(node.author);
    if (name) return name;
  }
  return metaContent(doc, 'meta[name="author"]');
}

function authorName(author) {
  if (!author) return null;
  if (typeof author === "string") return author.trim() || null;
  if (Array.isArray(author)) {
    for (const entry of author) {
      const name = authorName(entry);
      if (name) return name;
    }
    return null;
  }
  if (typeof author === "object" && typeof author.name === "string") {
    return author.name.trim() || null;
  }
  return null;
}

function findLanguage(doc) {
  const lang = doc.documentElement && doc.documentElement.getAttribute("lang");
  if (!lang || !lang.trim()) return null;
  return lang.trim().split(/[-_]/)[0].toLowerCase();
}

function cleanSourceUrl(href) {
  try {
    const url = new URL(href);
    const toRemove = [];
    for (const key of url.searchParams.keys()) {
      if (/^utm_/i.test(key) || TRACKING_PARAMS.test(key)) toRemove.push(key);
    }
    for (const key of toRemove) url.searchParams.delete(key);
    return url.href;
  } catch {
    return href;
  }
}

function findArticleJsonLd(doc) {
  const nodes = [];
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let parsed;
    try {
      parsed = JSON.parse(script.textContent);
    } catch {
      continue;
    }
    collectNodes(parsed, nodes);
  }
  return nodes.filter(isArticleNode);
}

function collectNodes(value, out) {
  if (Array.isArray(value)) {
    for (const entry of value) collectNodes(entry, out);
    return;
  }
  if (value && typeof value === "object") {
    out.push(value);
    if (Array.isArray(value["@graph"])) collectNodes(value["@graph"], out);
  }
}

// Matches Article, NewsArticle, BlogPosting, TechArticle, SocialMediaPosting, etc.
function isArticleNode(node) {
  const types = [].concat(node["@type"] || []);
  return types.some((t) => typeof t === "string" && /(Article|Posting)$/.test(t));
}
