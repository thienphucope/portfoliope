import { useState, useCallback } from 'react';
import { ensureLibsLoaded } from '@/lib/markdown';

/**
 * Holds the client mirror of server-managed cache.
 * Client reads and updates this state optimistically only.
 */
export function useContentCache({ serverRawCache }) {
  const [fullContentCache, setFullContentCache] = useState({});

  /** Render markdown to HTML */
  const renderMarkdownToHtml = useCallback(async (raw) => {
    try {
      await ensureLibsLoaded();
      if (!window.marked) return raw;
      return window.marked.parse(raw);
    } catch (e) {
      console.error('Failed to render HTML:', e);
      return raw;
    }
  }, []);

  const initializeFromServer = useCallback((contentCache = {}, rawCache = {}) => {
    setFullContentCache(contentCache || {});
    serverRawCache.current = { ...(rawCache || {}) };
  }, [serverRawCache]);

  const upsertCacheEntry = useCallback((fileId, raw, html = null, fetchedAt = Date.now()) => {
    serverRawCache.current[fileId] = raw;
    setFullContentCache((prev) => ({
      ...prev,
      [fileId]: {
        raw,
        html: html ?? prev?.[fileId]?.html ?? null,
        fetchedAt,
        date: prev?.[fileId]?.date,
      },
    }));
  }, [serverRawCache]);

  return { 
    fullContentCache, 
    setFullContentCache,
    renderMarkdownToHtml,
    initializeFromServer,
    upsertCacheEntry,
  };
}
