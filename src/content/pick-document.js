// Decide which document to extract from. Archive viewers like
// megalodon.jp (ウェブ魚拓) render the actual content inside a same-origin
// frame/iframe sized to dominate the page, with the top document holding
// only the viewer chrome (which can itself be text-heavy, so text volume
// alone cannot identify the wrapper).
//
// A frame qualifies as the content when it is same-origin readable,
// spans most of the viewport in both dimensions (ads and embeds never
// do), and holds a meaningful amount of text. Among qualifying frames
// the text-richest wins.
//
// Runs against the live window, so it is exercised by the E2E harness
// rather than the Node test suite; extract() itself stays document-pure.
const MIN_FRAME_TEXT = 400;
const MIN_SIZE_RATIO = 0.7;

export function pickContentDocument(win) {
  const viewportW = win.innerWidth || 0;
  const viewportH = win.innerHeight || 0;

  let best = null;
  for (const frameEl of win.document.querySelectorAll("frame, iframe")) {
    let doc;
    try {
      doc = frameEl.contentDocument;
    } catch {
      continue; // cross-origin
    }
    if (!doc || !doc.body) continue;

    const rect = frameEl.getBoundingClientRect();
    if (viewportW && rect.width < viewportW * MIN_SIZE_RATIO) continue;
    if (viewportH && rect.height < viewportH * MIN_SIZE_RATIO) continue;

    const length = textLength(doc.body);
    if (length < MIN_FRAME_TEXT) continue;

    if (!best || length > best.length) {
      let url;
      try {
        url = frameEl.contentWindow.location.href;
      } catch {
        continue;
      }
      best = { doc, url, length };
    }
  }

  if (best) {
    return { doc: best.doc, url: best.url, sourceUrl: win.location.href };
  }
  return {
    doc: win.document,
    url: win.location.href,
    sourceUrl: win.location.href,
  };
}

function textLength(el) {
  return ((el && el.textContent) || "").replace(/\s+/g, "").length;
}
