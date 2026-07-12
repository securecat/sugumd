// URL.createObjectURL is unavailable in MV3 service workers, so downloads
// travel as base64 data URLs instead.
export function toDataUrl(text, mimeType) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mimeType};charset=utf-8;base64,${btoa(binary)}`;
}
