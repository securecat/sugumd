// Development-only feature: save the rendered DOM of the current tab as a
// test fixture, via a context-menu item on the action icon. curl-fetched
// HTML is pre-JS-rendering and differs from what the extension actually
// sees, so fixtures must be captured through this path.
//
// To drop the feature for a store release: remove the initFixtureDebug()
// call in service-worker.js and the "contextMenus" permission.
import { toDataUrl } from "../common/data-url.js";

const MENU_ID = "sugumd-save-fixture";

export function initFixtureDebug() {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "デバッグ: DOMをHTML保存",
      contexts: ["action"],
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab || !tab.id) return;
    saveFixture(tab.id).catch((error) => {
      console.warn("sugumd: fixture save failed:", error);
    });
  });
}

export async function saveFixture(tabId) {
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      html: document.documentElement.outerHTML,
      url: location.href,
      host: location.hostname,
    }),
  });
  if (!result) return false;

  const date = localDate();
  const header = `<!-- source_url: ${result.url} clipped: ${date} -->\n`;
  const downloadId = await chrome.downloads.download({
    url: toDataUrl(header + result.html, "text/html"),
    filename: `fixture_${date}_${result.host}.html`,
    saveAs: false,
    conflictAction: "uniquify",
  });
  return typeof downloadId === "number";
}

function localDate() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}
