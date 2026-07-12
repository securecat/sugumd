import TurndownService from "turndown";
import { tables } from "turndown-plugin-gfm";

export function buildMarkdown(meta, contentHtml) {
  const body = createTurndown().turndown(contentHtml).trim();
  return `${buildFrontmatter(meta)}\n${body}\n`;
}

function createTurndown() {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  service.use(tables);

  // <figure><img><figcaption> is captured as one unit so alt/caption
  // end up as quoted lines right under the image.
  service.addRule("figureWithImage", {
    filter: (node) => node.nodeName === "FIGURE" && node.querySelector("img"),
    replacement: (content, node) => {
      const block = imageBlock(node.querySelector("img"), node.querySelector("figcaption"));
      return block ? `\n\n${block}\n\n` : "";
    },
  });

  // Standalone <img> outside a figure gets the same treatment (alt line only).
  service.addRule("imageWithAlt", {
    filter: "img",
    replacement: (content, node) => {
      const block = imageBlock(node, null);
      return block ? `\n\n${block}\n\n` : "";
    },
  });

  return service;
}

function imageBlock(img, figcaption) {
  if (!img) return "";
  const src = img.getAttribute("src");
  if (!src || !src.trim()) return "";

  const alt = (img.getAttribute("alt") || "").trim();
  const caption = figcaption ? collapseToLine(figcaption.textContent) : "";

  const lines = [`![${escapeAlt(alt)}](${escapeUrl(src.trim())})`];
  // Empty alt means "decorative" and is respected; identical alt/caption
  // collapses to the caption line only.
  if (alt && alt !== caption) lines.push(`> alt: ${alt}`);
  if (caption) lines.push(`> caption: ${caption}`);
  return lines.join("\n");
}

function collapseToLine(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function escapeAlt(text) {
  return text.replace(/([[\]])/g, "\\$1");
}

function escapeUrl(url) {
  return url.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

const FRONTMATTER_KEYS = [
  ["title", "title"],
  ["source_url", "sourceUrl"],
  ["author", "author"],
  ["published", "published"],
  ["clipped", "clipped"],
  ["language", "language"],
];

function buildFrontmatter(meta) {
  const lines = ["---"];
  for (const [key, prop] of FRONTMATTER_KEYS) {
    const value = meta[prop];
    if (typeof value === "string" && value.trim()) {
      lines.push(`${key}: ${yamlValue(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

// Double-quote whenever the value contains anything YAML could
// misinterpret; plain scalars pass through untouched.
function yamlValue(value) {
  const v = String(value).replace(/\s+/g, " ").trim();
  if (/[:#'"{}[\]&*!|>%@`,\\]/.test(v) || /^[-?]/.test(v)) {
    return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return v;
}
