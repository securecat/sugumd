const FORBIDDEN_MAP = {
  "\\": "＼",
  "/": "／",
  ":": "：",
  "*": "＊",
  "?": "？",
  '"': "＂",
  "<": "＜",
  ">": "＞",
  "|": "｜",
};

// Cap the basename (filename without extension) by UTF-8 byte length, not
// character count: Google Drive, ext4 and APFS limit names to 255 bytes,
// and a Japanese title at 3 bytes per character blows past that long
// before 255 characters. 220 leaves a safety margin.
const MAX_BASENAME_BYTES = 220;

export function buildFilename(title, clippedDate) {
  const prefix = `${clippedDate}_`;
  const suffix = ".md";

  let name = sanitizeTitle(title);
  name = truncateToBytes(name, MAX_BASENAME_BYTES - byteLength(prefix)).replace(/[. ]+$/u, "");
  if (!name) name = "untitled";

  return `${prefix}${name}${suffix}`;
}

export function sanitizeTitle(title) {
  return String(title || "")
    .replace(/[\\/:*?"<>|]/g, (ch) => FORBIDDEN_MAP[ch])
    .replace(/\p{Cc}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/u, "");
}

function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

// Cut at a code-point boundary so surrogate pairs (emoji etc.) stay intact.
function truncateToBytes(text, maxBytes) {
  const encoder = new TextEncoder();
  let bytes = 0;
  let result = "";
  for (const ch of text) {
    bytes += encoder.encode(ch).length;
    if (bytes > maxBytes) break;
    result += ch;
  }
  return result;
}
