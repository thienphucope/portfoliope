/**
 * Utility functions for the BlockEditor.
 * Logic for storage, cursor management, and markdown line types.
 */

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

export const cacheKey  = (name) => `vault_v3::${name}`;

export const readCache = (name) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(cacheKey(name)));
  } catch {
    return null;
  }
};

export const saveCache = (name, data) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(name), JSON.stringify(data));
  } catch {}
};

export const mkBlock = (raw = '', type = 'paragraph') => ({
  id: `b${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  raw,
  type,
});
