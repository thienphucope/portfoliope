import { useCallback, useRef } from 'react';
import { readCache } from '../utils/editor';

/**
 * Manages tab clicks, overlay toggling, unsaved-change guards,
 * and browser history pop-state restoration.
 */
export function useTabManager({
  tabs,
  activeTab,
  setActiveTab,
  activeOverlay,
  setActiveOverlay,
  isEditing,
  setIsEditing,
  fileName,
  content,
  editPass,
  serverRawCache,
  fileRegistry,
  staticRecords,
  applyFileContent,
  loadFile,
  handleSaveFile,
  releaseLock,
  stopKeepAlive,
  setShowSearch,
}) {
  const lastActiveNote = useRef(null);

  // ─── Tab click ─────────────────────────────────────────────────────────────

  const handleTabClick = useCallback(
    async (tab, e) => {
      if (tab.id === 'filetree' || tab.id === 'chat') {
        setActiveOverlay((prev) => (prev === tab.id ? null : tab.id));
        return;
      }

      if (activeTab === tab.id) {
        if (activeOverlay) setActiveOverlay(null);
        return;
      }

      setActiveOverlay(null);

      // Guard unsaved changes
      if (isEditing && fileName) {
        const cached = readCache(fileName);
        const raw    =
          Array.isArray(cached) && cached.length > 0
            ? cached.map((b) => b.raw).join('\n\n')
            : content;
        const serverRaw = serverRawCache.current[fileName] || '';

        if (raw.trim() !== serverRaw.trim()) {
          const wantsToSave = window.confirm(
            'You have unsaved changes. Do you want to save before leaving?'
          );
          if (wantsToSave) await handleSaveFile(raw);
        }

        stopKeepAlive();
        if (editPass) releaseLock(fileName, editPass);
        setIsEditing(false);
      }

      if (activeTab !== 'filetree' && activeTab !== 'chat' && activeTab !== null) {
        lastActiveNote.current = activeTab;
      }

      setActiveTab(tab.id);
      if (tab.id === 'filetree') setShowSearch(true);

      if (tab.type === 'static') {
        applyFileContent(tab.id, tab.content);
        const cleanPath = tab.id.replace('system::', '');
        window.history.pushState({ repoKey: tab.id }, '', `/case/${cleanPath}`);
      } else if (tab.type === 'editor') {
        const cached   = readCache(tab.id);
        const openedF  = tabs.find((t) => t.id === tab.id);

        if (Array.isArray(cached) && cached.length > 0) {
          applyFileContent(tab.id, cached.map((b) => b.raw).join('\n\n'));
        } else if (openedF?.fileData?.path) {
          loadFile(openedF.fileData.path, openedF.fileData.name, tab.id, 'push');
        } else {
          applyFileContent(tab.id, `# ${tab.title}\nLoading...`);
        }

        const cleanPath = tab.id.replace(/\.md$/, '');
        const newUrl    = `/case/${cleanPath}`;
        if (window.location.pathname !== newUrl) {
          window.history.pushState({ repoKey: tab.id }, '', newUrl);
        }
      }
    },
    [
      tabs, activeTab, activeOverlay, isEditing, fileName, content, editPass,
      serverRawCache, fileRegistry, applyFileContent, loadFile, handleSaveFile,
      releaseLock, stopKeepAlive, setActiveTab, setActiveOverlay, setIsEditing, setShowSearch,
    ]
  );

  // ─── Browser back/forward ──────────────────────────────────────────────────

  const handlePopState = useCallback(
    (e) => {
      if (!e.state) {
        setActiveTab(null);
        setActiveOverlay(null);
        return;
      }

      const { repoKey } = e.state;
      if (!repoKey) {
        setActiveTab(null);
        setActiveOverlay(null);
        return;
      }

      if (repoKey === 'chat' || repoKey === 'filetree') {
        setActiveOverlay(repoKey);
        return;
      }

      setActiveOverlay(null);

      if (typeof repoKey === 'string' && repoKey.startsWith('system::')) {
        const staticMatch = staticRecords.find((r) => r.id === repoKey);
        if (staticMatch) {
          setActiveTab(staticMatch.id);
          applyFileContent(staticMatch.id, staticMatch.content);
          return;
        }
      }

      const realPath = fileRegistry.current[repoKey.toLowerCase()];
      if (realPath) {
        loadFile(realPath, repoKey.split('/').pop(), repoKey, 'none');
      }
    },
    [fileRegistry, staticRecords, applyFileContent, loadFile, setActiveTab, setActiveOverlay]
  );

  return { handleTabClick, handlePopState, lastActiveNote };
}
