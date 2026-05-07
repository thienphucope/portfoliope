import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { parseNote } from '../utils/noteParser';
import { extractMedia } from '../utils/mediaExtractor';

export const BATCH_SIZE = 10;

export function useFetchBatch({ allFiles, fileRegistry, fullContentCache, upsertCacheEntry, isMounted, libsReady }) {
  const [displayedCases, setDisplayedCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('notefeed_loaded_count');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  const loadingRef = useRef(false);

  const sortedFiles = useMemo(() => {
    return [...allFiles].sort((a, b) => {
      const dateA = fullContentCache[a.id]?.date ? new Date(fullContentCache[a.id].date).getTime() : 0;
      const dateB = fullContentCache[b.id]?.date ? new Date(fullContentCache[b.id].date).getTime() : 0;
      return dateB - dateA;
    });
  }, [allFiles, fullContentCache]);

  const fetchBatch = useCallback(async (start, end) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const results = await Promise.all(sortedFiles.slice(start, end).map(async (file) => {
      let content = fullContentCache[file.id]?.raw;
      let date    = fullContentCache[file.id]?.date;
      if (!content) {
        try {
          const url = fileRegistry[file.id.toLowerCase()] || fileRegistry[file.id.toLowerCase() + '.md'];
          if (!url) return null;
          const res = await fetch(url);
          content = await res.text();
          const lastMod = res.headers.get('Last-Modified');
          date = lastMod ? new Date(lastMod).toISOString() : null;
          upsertCacheEntry(file.id, content, null, date);
        } catch { return null; }
      }
      if (!content) return null;
      if (!/tag:[^\n*]*#content(?:\s|#|\*|,|$)/i.test(content)) return null;
      return { ...parseNote(content, file.name, file.id, date), media: extractMedia(content)[0] || null };
    }));

    setDisplayedCases((prev) => [...prev, ...results.filter(Boolean)]);
    setLoadedCount(end);
    sessionStorage.setItem('notefeed_loaded_count', end.toString());
    setLoading(false);
    loadingRef.current = false;
  }, [sortedFiles, fileRegistry, fullContentCache, upsertCacheEntry]);

  useEffect(() => {
    if (isMounted && libsReady && sortedFiles.length > 0 && displayedCases.length === 0) {
      fetchBatch(0, loadedCount > 0 ? loadedCount : BATCH_SIZE);
    }
  }, [sortedFiles, isMounted, libsReady, displayedCases.length, fetchBatch, loadedCount]);

  return { displayedCases, loading, loadedCount, fetchBatch, totalCount: allFiles.length };
}
