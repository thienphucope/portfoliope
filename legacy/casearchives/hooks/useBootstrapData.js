import { useState, useEffect, useCallback } from 'react';
import { getAllFilesFromTree } from '../utils/treeUtils';

export function useBootstrapData(serverData) {
  const [allFiles, setAllFiles] = useState([]);
  const [fileRegistry, setFileRegistry] = useState({});
  const [fullContentCache, setFullContentCache] = useState({});

  useEffect(() => {
    if (serverData?.tree) {
      setAllFiles(getAllFilesFromTree(serverData.tree));
      setFileRegistry(serverData.registry || {});
      setFullContentCache(serverData.contentCache || {});
      return;
    }
    fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bootstrap' }),
    })
      .then((r) => r.json())
      .then((boot) => {
        if (boot?.ok && Array.isArray(boot.tree)) {
          setAllFiles(getAllFilesFromTree(boot.tree));
          setFileRegistry(boot.registry || {});
          setFullContentCache(boot.contentCache || {});
        }
      })
      .catch((e) => console.error('NoteFeed bootstrap error:', e));
  }, []);

  const upsertCacheEntry = useCallback((id, raw, html, date) => {
    setFullContentCache((prev) => ({ ...prev, [id]: { raw, html, date, fetchedAt: Date.now() } }));
  }, []);

  return { allFiles, fileRegistry, fullContentCache, upsertCacheEntry };
}
