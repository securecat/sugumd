import { extract } from "./extract-page.js";
import { pickContentDocument } from "./pick-document.js";

// Injected via chrome.scripting.executeScript({ files }); the service worker
// then calls one of these in a second injection to get the result.
window.__sugumdExtract = () => {
  const target = pickContentDocument(window);
  return extract(target.doc, target.url, target.sourceUrl);
};

// Used by the development-only fixture saver: returns the same document
// the extraction would run on, so frame-based pages produce a usable
// fixture (the content frame, not the empty wrapper).
window.__sugumdFixtureSource = () => {
  const target = pickContentDocument(window);
  return {
    html: target.doc.documentElement.outerHTML,
    url: target.url,
    host: window.location.hostname,
  };
};
