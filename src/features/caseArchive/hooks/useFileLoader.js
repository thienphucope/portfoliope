import { useState, useCallback } from 'react';

/**
 * Read-only file loader: opens a note from the hydrated cache, falling back to
 * a single server read only when the content is not already cached.
 * Manages the open-files list, the active tab, and browser history.
 */
export function useFileLoader({
  serverRawCache,
  upsertCacheEntry,
  applyFileContent,
  setActiveOverlay,
}) {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  const loadFile = useCallback(
    async (path, name, serverPath = null, historyMode = 'push', activate = true) => {
      // 1. Resolve the repo key used to address the cache / server.
      let repoKey = serverPath;
      if (!repoKey && path) {
        try {
          const urlParts = new URL(path, window.location.origin).pathname.split('/').slice(1);
          repoKey = decodeURIComponent(urlParts.slice(3).join('/'));
        } catch (e) {
          repoKey = name;
        }
      } else if (!repoKey) {
        repoKey = name;
      }

      // 2. Serve instantly from the hydrated cache when available.
      let newContent = serverRawCache.current[repoKey] ?? null;

      if (activate) {
        setActiveTab(repoKey);
        if (setActiveOverlay) setActiveOverlay(null);
        applyFileContent(repoKey, newContent ?? '');
      }

      // 3. Only hit the network when the note was not in the cache.
      if (newContent == null) {
        try {
          const apiRes = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', path: repoKey }),
          });
          const data = await apiRes.json();

          if (data.ok) {
            newContent = data.raw || '';
            upsertCacheEntry(repoKey, newContent, data.html ?? null, Date.now());
          } else if (path) {
            const res = await fetch(path);
            newContent = await res.text();
            upsertCacheEntry(repoKey, newContent, null, Date.now());
          } else {
            newContent = '';
          }
        } catch (e) {
          console.error('Error loading file:', e);
          newContent = '# Error\nFailed to load.';
        }
        if (activate) applyFileContent(repoKey, newContent);
      }

      if (repoKey && repoKey !== 'error') {
        setOpenFiles((prev) => {
          if (!prev.find((f) => f.id === repoKey)) {
            return [...prev, { id: repoKey, path, name, serverPath: repoKey, fetchedContent: newContent }];
          }
          return prev.map((f) =>
            f.id === repoKey ? { ...f, fetchedContent: newContent } : f
          );
        });

        if (activate) {
          const cleanPath = repoKey.replace(/\.md$/, '');
          const newUrl    = `/${cleanPath}`;
          if (window.location.pathname !== newUrl) {
            if (historyMode === 'replace') {
              window.history.replaceState({ repoKey }, '', newUrl);
            } else if (historyMode === 'push') {
              window.history.pushState({ repoKey }, '', newUrl);
            }
          }
        }
      }
    },
    [applyFileContent, serverRawCache, upsertCacheEntry, setActiveOverlay]
  );

  return { openFiles, setOpenFiles, activeTab, setActiveTab, loadFile };
}
