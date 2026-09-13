// Shared festive config: the active occasion drives the title dot color (NoteFeed,
// via data-holiday → NoteFeed.module.css) and the sidebar reel clip (ArchiveSidebar).
export const FESTIVALS = ['halloween', 'christmas', 'newyear', 'trungthu', 'tet'];

// Debug: set to a key from FESTIVALS to force that occasion regardless of date; '' = off.
export const OVERRIDE_FESTIVAL = '';

// Lunar days have no fixed Gregorian date → per-year table. mùng 1 Tết / rằm Trung Thu.
const TET_DAY = { 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11' };
const TRUNGTHU_DAY = { 2025: '10-06', 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19' };

// Reel clip per occasion: { id } YouTube video, optional { start } in seconds.
export const FESTIVAL_VIDEO = {
  halloween: { id: 'NaJz1PdbjCM' },
  christmas: { id: 'aAkMkVFwAoo' },
  newyear:   { id: '3Uo0JAUWijM' },
  trungthu:  { id: '3yqNzMuCBRo', start: 813 },
  tet:       { id: 'pWqyW7BlvfE' },
};

function inLunarWindow(table, y, m, day, before, after) {
  const t = table[y];
  if (!t) return false;
  const [mm, dd] = t.split('-').map(Number);
  const diff = (new Date(y, m - 1, day) - new Date(y, mm - 1, dd)) / 86400000;
  return diff >= -before && diff <= after;
}

// The occasion active on date `d` (client-local), or '' for an ordinary day.
// Windows start when the mood does and never overlap (see gaps below). First match wins,
// so New Year is tested before Christmas to claim the tail of December.
export function holidayForDate(d = new Date()) {
  if (OVERRIDE_FESTIVAL) return OVERRIDE_FESTIVAL;
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  if ((m === 12 && day >= 27) || (m === 1 && day <= 5)) return 'newyear';     // Dec 27 – Jan 5
  if (m === 12) return 'christmas';                                           // Dec 1 – 26 (27+ is New Year above)
  if (m === 10 && day >= 18) return 'halloween';                              // Oct 18 – 31
  if (inLunarWindow(TET_DAY, y, m, day, 12, 6)) return 'tet';                 // ~12d before → mùng 7 (well after New Year)
  if (inLunarWindow(TRUNGTHU_DAY, y, m, day, 12, 1)) return 'trungthu';       // ~12d before → rằm +1 (gap before Halloween)
  return '';
}
