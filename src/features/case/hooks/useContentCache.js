import { useState, useEffect, useCallback } from 'react';

/**
 * Pre-fetches and caches the raw markdown content of every file in the vault.
 * Used primarily to build the graph view link graph without lazy loads.
 */
export function useContentCache({ allFiles, serverRawCache }) {
  const [fullContentCache, setFullContentCache] = useState({});

  useEffect(() => {
    if (allFiles.length === 0) return;

    const fetchAll = async () => {
      const newCache = { ...fullContentCache };
      let changed    = false;

      await Promise.all(
        allFiles.map(async (file) => {
          if (!newCache[file.id] && file.path) {
            try {
              const res  = await fetch(file.path);
              const text = await res.text();
              newCache[file.id]                   = text;
              serverRawCache.current[file.id]     = text; // Warm raw cache too
              changed = true;
            } catch (e) {
              console.error('Failed to pre-fetch:', file.id, e);
            }
          }
        })
      );

      if (changed) setFullContentCache(newCache);
    };

    fetchAll();
    // Only re-run when the file list changes, not on every cache update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFiles]);

  return { fullContentCache, setFullContentCache };
}
