export function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Normalize to YYYY-MM-DD. ISO strings keep their date part as-is
// (no timezone conversion); anything else goes through Date parsing.
export function normalizeDate(value) {
  if (!value) return null;
  const v = String(value).trim();
  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const parsed = new Date(v);
  return Number.isNaN(parsed.getTime()) ? null : formatLocalDate(parsed);
}
