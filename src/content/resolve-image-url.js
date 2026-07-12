const LAZY_ATTRS = ["data-src", "data-lazy-src", "data-original"];

// Resolve the real image URL (lazy-load aware), as an absolute URL.
// Kept as an independent function so a future base64-embedding option
// can reuse it as-is.
export function resolveImageUrl(img, baseUrl) {
  for (const attr of LAZY_ATTRS) {
    const value = img.getAttribute(attr);
    if (value && value.trim() && !value.trim().startsWith("data:")) {
      return toAbsoluteUrl(value.trim(), baseUrl);
    }
  }
  const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
  const fromSrcset = pickLargestFromSrcset(srcset);
  if (fromSrcset) return toAbsoluteUrl(fromSrcset, baseUrl);

  const src = img.getAttribute("src");
  if (src && src.trim()) return toAbsoluteUrl(src.trim(), baseUrl);
  return null;
}

// Rewrite every <img> in the (cloned) document to its resolved absolute URL
// before Readability/Turndown run, and drop the lazy attributes so nothing
// downstream picks a placeholder again.
export function prepareImages(doc, baseUrl) {
  for (const img of doc.querySelectorAll("img")) {
    const resolved = resolveImageUrl(img, baseUrl);
    if (resolved) img.setAttribute("src", resolved);
    img.removeAttribute("srcset");
    img.removeAttribute("data-srcset");
    for (const attr of LAZY_ATTRS) img.removeAttribute(attr);
  }
}

function pickLargestFromSrcset(srcset) {
  if (!srcset || !srcset.trim()) return null;
  let best = null;
  let bestSize = -1;
  for (const candidate of srcset.split(",")) {
    const parts = candidate.trim().split(/\s+/);
    const url = parts[0];
    if (!url || url.startsWith("data:")) continue;
    const descriptor = parts[1] || "";
    let size = 1;
    const w = descriptor.match(/^(\d+(?:\.\d+)?)w$/);
    const x = descriptor.match(/^(\d+(?:\.\d+)?)x$/);
    if (w) size = parseFloat(w[1]);
    else if (x) size = parseFloat(x[1]);
    if (size > bestSize) {
      bestSize = size;
      best = url;
    }
  }
  return best;
}

function toAbsoluteUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}
