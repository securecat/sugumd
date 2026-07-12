import { extractPage } from "./extract-page.js";

// Injected via chrome.scripting.executeScript({ files }); the service worker
// then calls window.__sugumdExtract() in a second injection to get the result.
window.__sugumdExtract = () => extractPage(document, window.location);
