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

const MAX_FILENAME_LENGTH = 100;

export function buildFilename(title, clippedDate) {
  const prefix = `${clippedDate}_`;
  const suffix = ".md";
  const maxTitleLength = MAX_FILENAME_LENGTH - prefix.length - suffix.length;

  let name = sanitizeTitle(title);
  // Array.from keeps surrogate pairs (emoji etc.) intact when truncating.
  name = Array.from(name).slice(0, maxTitleLength).join("").replace(/[. ]+$/u, "");
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
