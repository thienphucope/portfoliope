import { useEffect } from 'react';

/**
 * Warns the user before closing/refreshing if there are unsaved drafts
 * in localStorage that differ from the last known server version.
 */
export function useBeforeUnload({ serverRawCache }) {
  useEffect(() => {
    const onBeforeUnload = (e) => {
      const dirtyKeys = [];

      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k?.startsWith('vault_v3::')) continue;

          const fp     = k.replace('vault_v3::', '');
          const cached = (() => {
            try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
          })();

          if (!Array.isArray(cached) || cached.length === 0) continue;

          const cachedRaw = cached.map((b) => b.raw).join('\n\n').trim();
          const serverRaw = (serverRawCache.current[fp] || '').trim();

          if (serverRaw && serverRaw !== cachedRaw) dirtyKeys.push(k);
        }
      } catch {}

      if (dirtyKeys.length === 0) return;

      e.preventDefault();
      e.returnValue = '';

      // Flush dirty drafts only after user has confirmed navigation
      window.addEventListener(
        'unload',
        () => dirtyKeys.forEach((k) => { try { localStorage.removeItem(k); } catch {} }),
        { once: true }
      );
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [serverRawCache]);
}
