import { useCallback, useRef } from 'react';

const OVERLAY_TABS = new Set(['filetree', 'chat', 'pdf']);

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
  const lastProcessedKey = useRef(null);

  // ─── Tab click ─────────────────────────────────────────────────────────────

  const handleTabClick = useCallback(
    async (tab, e) => {
      if (OVERLAY_TABS.has(tab.id)) {
        setActiveOverlay((prev) => (prev === tab.id ? null : tab.id));
        return;
      }

      if (activeTab === tab.id) {
        // If an overlay is open, close it first
        if (activeOverlay) setActiveOverlay(null);

        // Clicking the already-open tab should close it and return to /project/casearchives.
        // Apply the same unsaved-changes guard as when switching tabs.
        if (isEditing && fileName) {
          const raw = content;
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

        if (activeTab !== null && !OVERLAY_TABS.has(activeTab)) {
          lastActiveNote.current = activeTab;
        }

        setActiveTab(null);
        setActiveOverlay(null);
        lastProcessedKey.current = null;
        // Gắn label isRoot để nhận diện trang chủ kho lưu trữ
        window.history.pushState({ isRoot: true }, '', '/project/casearchives');
        return;
      }

      setActiveOverlay(null);
      lastProcessedKey.current = tab.id;

      // Guard unsaved changes
      if (isEditing && fileName) {
        const raw = content;
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

      if (activeTab !== null && !OVERLAY_TABS.has(activeTab)) {
        lastActiveNote.current = activeTab;
      }

      setActiveTab(tab.id);
      if (tab.id === 'filetree') setShowSearch(true);

      if (tab.type === 'static') {
        applyFileContent(tab.id, tab.content);
        const cleanPath = tab.id.replace('system::', '');
        window.history.pushState({ repoKey: tab.id }, '', `/project/casearchives/${cleanPath}`);
      } else if (tab.type === 'editor') {
        const openedF  = tabs.find((t) => t.id === tab.id);

        if (openedF?.fileData?.path) {
          loadFile(openedF.fileData.path, openedF.fileData.name, tab.id, 'push');
        } else {
          applyFileContent(tab.id, `# ${tab.title}\nLoading...`);
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
      const state = e.state || {};
      const repoKey = state.repoKey || null;

      // Tránh xử lý trùng lặp nếu state không đổi (ngăn freeze khi back/forward nhanh)
      if (lastProcessedKey.current === repoKey) return;
      lastProcessedKey.current = repoKey;

      if (!repoKey) {
        setActiveTab(null);
        setActiveOverlay(null);
        return;
      }

      if (OVERLAY_TABS.has(repoKey)) {
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
        // Dùng 'none' để không push thêm state vào history khi đang pop
        loadFile(realPath, repoKey.split('/').pop(), repoKey, 'none');
      }
    },
    [fileRegistry, staticRecords, applyFileContent, loadFile, setActiveTab, setActiveOverlay]
  );

  return { handleTabClick, handlePopState, lastActiveNote };
}
