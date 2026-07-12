import { buildFilename } from "../common/filename.js";
import { toDataUrl } from "../common/data-url.js";
import { initFixtureDebug } from "./debug-fixture.js";

initFixtureDebug();

// State is shown by the badge alone: shape (✓ / !) and color (green / red)
// are both distinct, so the redundancy holds without swapping the icon.
// White text on these backgrounds clears 7:1 contrast.
const BADGE = {
  success: { text: "✓", color: "#166534" },
  failed: { text: "!", color: "#991b1b" },
};

const DOWNLOAD_TIMEOUT_MS = 30000;

// Ignore re-clicks while a clip is in flight. The worker may be killed by
// Chrome between events, but a clip only takes a few seconds so a
// short-lived in-memory flag is enough.
const busyTabs = new Set();

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || busyTabs.has(tab.id)) return;
  busyTabs.add(tab.id);
  try {
    const ok = await clipTab(tab.id);
    await showState(tab.id, ok ? "success" : "failed");
  } catch {
    await showState(tab.id, "failed");
  } finally {
    busyTabs.delete(tab.id);
  }
});

async function clipTab(tabId) {
  let extracted;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["dist/extract.js"],
    });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__sugumdExtract(),
    });
    extracted = result;
  } catch (error) {
    // chrome:// pages, the Web Store, PDF viewer, etc. — injection refused.
    console.warn("sugumd: injection failed:", error);
    return false;
  }

  if (!extracted || extracted.error || !extracted.markdown) {
    console.warn("sugumd: extraction failed:", extracted && extracted.error);
    return false;
  }

  const filename = buildFilename(extracted.meta.title, extracted.meta.clipped);
  let downloadId;
  try {
    downloadId = await chrome.downloads.download({
      url: toDataUrl(extracted.markdown, "text/markdown"),
      filename,
      saveAs: false,
      conflictAction: "uniquify",
    });
  } catch (error) {
    console.warn("sugumd: download failed:", error);
    return false;
  }

  return waitForDownload(downloadId);
}

function waitForDownload(downloadId) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, DOWNLOAD_TIMEOUT_MS);

    function onChanged(delta) {
      if (delta.id !== downloadId || !delta.state) return;
      if (delta.state.current === "complete") {
        cleanup();
        resolve(true);
      } else if (delta.state.current === "interrupted") {
        cleanup();
        resolve(false);
      }
    }

    function cleanup() {
      clearTimeout(timer);
      chrome.downloads.onChanged.removeListener(onChanged);
    }

    chrome.downloads.onChanged.addListener(onChanged);

    // The download may already be settled before the listener attached.
    chrome.downloads.search({ id: downloadId }, (items) => {
      const item = items && items[0];
      if (!item) return;
      if (item.state === "complete") {
        cleanup();
        resolve(true);
      } else if (item.state === "interrupted") {
        cleanup();
        resolve(false);
      }
    });
  });
}

// Tab-scoped badge state resets to the defaults on navigation or reload
// (Chrome standard behavior), so there is no explicit reset here. The
// calls are settled independently so one failure (or a tab closed
// mid-clip) doesn't take the others down with it.
async function showState(tabId, state) {
  const badge = BADGE[state];
  const results = await Promise.allSettled([
    chrome.action.setBadgeText({ tabId, text: badge.text }),
    chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color }),
    chrome.action.setBadgeTextColor({ tabId, color: "#ffffff" }),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.warn("sugumd: state display failed:", r.reason);
  }
}
