import { useState, useCallback } from 'react';
import { decodeBase64 } from '../utils/encoding';

/**
 * Handles fetching file content from the API / CDN fallback,
 * managing the open-files list and active tab, and updating browser history.
 */
export function useFileLoader({ fileRegistry, serverRawCache, applyFileContent, setActiveOverlay }) {
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

          // Try API first for freshest content
          const apiRes = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get', path: repoKey }),
          });
          const data = await apiRes.json();

          if (data.ok && data.content) {
            newContent = decodeBase64(data.content);
            if (data.sha) setFileSha(data.sha);
          } else {
            // CDN fallback
            const res = await fetch(path);
            newContent = await res.text();
          }

          serverRawCache.current[repoKey] = newContent;
          applyFileContent(repoKey, newContent);
        } catch {
          repoKey = serverPath || name;
          applyFileContent(repoKey, '# Error\nFailed to load.');
        }
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
          setActiveTab(repoKey);
          const cleanPath = repoKey.replace(/\.md$/, '');
          const newUrl    = `/case/${cleanPath}`;
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
    [applyFileContent, serverRawCache]
  );

  return { openFiles, setOpenFiles, activeTab, setActiveTab, fileSha, setFileSha, loadFile };
}
