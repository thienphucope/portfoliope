import { useState, useCallback } from 'react';

/**
 * Handles fetching file content from the API / CDN fallback,
 * managing the open-files list and active tab, and updating browser history.
 * Uses HTML cache for instant tab loading.
 */
export function useFileLoader({ 
  fileRegistry, 
  serverRawCache, 
  upsertCacheEntry,
  syncServerStructures,
  applyFileContent, 
  setActiveOverlay
}) {
  const [openFiles, setOpenFiles] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileSha,   setFileSha]   = useState(null);

  const loadFile = useCallback(
    async (path, name, serverPath = null, historyMode = 'push', activate = true) => {
      if (activate) {
        setActiveTab(serverPath);
        if (setActiveOverlay) setActiveOverlay(null);
      }

      let repoKey;
      let newContent = '';

      if (!path) {
        // Local-only file (newly created, never saved)
        repoKey = serverPath || name;
        newContent = `# ${name.replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`;
        applyFileContent(repoKey, newContent);
      } else {
        try {
          const urlParts = new URL(path, window.location.origin).pathname.split('/').slice(1);
          repoKey = serverPath || decodeURIComponent(urlParts.slice(3).join('/'));

          // Always read from server cache on tab open/click.
          const apiRes = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', path: repoKey }),
          });
          const data = await apiRes.json();

          if (data.ok) {
            newContent = data.raw || '';
            if (data.sha) setFileSha(data.sha);
            upsertCacheEntry(repoKey, newContent, data.html ?? null, Date.now());
            applyFileContent(repoKey, newContent);
          } else {
            // Last fallback: raw URL
            const res = await fetch(path);
            newContent = await res.text();
            upsertCacheEntry(repoKey, newContent, null, Date.now());
            applyFileContent(repoKey, newContent);
          }
        } catch (e) {
          console.error('Error loading file:', e);
          repoKey = serverPath || name;
          applyFileContent(repoKey, '# Error\nFailed to load.');
        }
      }

      if (repoKey && repoKey !== 'error') {
        setOpenFiles((prev) => {
          if (!prev.find((f) => f.id === repoKey)) {
            return [...prev, { 
              id: repoKey, 
              path, 
              name, 
              serverPath: repoKey, 
              fetchedContent: newContent
            }];
          }
          return prev.map((f) =>
            f.id === repoKey ? { ...f, fetchedContent: newContent } : f
          );
        });

        if (activate) {
          setActiveTab(repoKey);
          const cleanPath = repoKey.replace(/\.md$/, '');
          const newUrl    = `/project/casearchives/${cleanPath}`;
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
    [applyFileContent, serverRawCache, upsertCacheEntry, syncServerStructures]
  );

  return { openFiles, setOpenFiles, activeTab, setActiveTab, fileSha, setFileSha, loadFile };
}
