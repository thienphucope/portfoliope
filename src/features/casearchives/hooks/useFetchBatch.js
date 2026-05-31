import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { parseNote } from '../utils/noteParser';
import { extractMedia } from '../utils/mediaExtractor';

export const BATCH_SIZE = 30;

export function useFetchBatch({ allFiles, fileRegistry, fullContentCache, upsertCacheEntry, isMounted, libsReady, searchTerm = '' }) {
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

  // Reset displayedCases and loadedCount when searchTerm changes
  useEffect(() => {
    setDisplayedCases([]);
    setLoadedCount(0);
  }, [searchTerm]);

  const filteredSortedFiles = useMemo(() => {
    const sorted = [...allFiles].sort((a, b) => {
      const dateA = fullContentCache[a.id]?.date ? new Date(fullContentCache[a.id].date).getTime() : 0;
      const dateB = fullContentCache[b.id]?.date ? new Date(fullContentCache[b.id].date).getTime() : 0;
      return dateB - dateA;
    });

    if (!searchTerm.trim()) return sorted;

    const query = searchTerm.toLowerCase();
    return sorted.filter((file) => {
      const content = fullContentCache[file.id]?.raw;
      const parsed = content ? parseNote(content, file.name, file.id, fullContentCache[file.id]?.date) : null;
      
      const matchTitle = file.name.toLowerCase().includes(query) || (parsed?.displayTitle && parsed.displayTitle.toLowerCase().includes(query));
      const matchTag = parsed?.tag && parsed.tag.toLowerCase().includes(query);
      const matchAuthor = parsed?.author && parsed.author.toLowerCase().includes(query);
      const matchContent = content && content.toLowerCase().includes(query);
      
      return matchTitle || matchTag || matchAuthor || matchContent;
    });
  }, [allFiles, fullContentCache, searchTerm]);

  const fetchBatch = useCallback(async (start, end) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const results = await Promise.all(filteredSortedFiles.slice(start, end).map(async (file) => {
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
      return { ...parseNote(content, file.name, file.id, date), media: extractMedia(content)[0] || null };
    }));

    setDisplayedCases((prev) => {
      if (start === 0) {
        return results.filter(Boolean);
      }
      return [...prev, ...results.filter(Boolean)];
    });
    setLoadedCount(end);
    if (!searchTerm) {
      sessionStorage.setItem('notefeed_loaded_count', end.toString());
    }
    setLoading(false);
    loadingRef.current = false;
  }, [filteredSortedFiles, fileRegistry, fullContentCache, upsertCacheEntry, searchTerm]);

  useEffect(() => {
    if (isMounted && libsReady && filteredSortedFiles.length > 0 && displayedCases.length === 0) {
      fetchBatch(0, loadedCount > 0 ? loadedCount : BATCH_SIZE);
    }
  }, [filteredSortedFiles, isMounted, libsReady, displayedCases.length, fetchBatch, loadedCount]);

  return { displayedCases, loading, loadedCount, fetchBatch, totalCount: filteredSortedFiles.length };
}
