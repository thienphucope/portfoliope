import { useState, useCallback } from 'react';
import { readCache } from '../../../app/case/[[...slug]]/components/BlockEditor';

const decodeBase64 = (str) => {
  if (!str) return '';
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return atob(str);
  }
};

/**
 * Manages edit-mode toggling with lock acquisition / release,
 * password session, and freshness check against server content.
 */
export function useEditorState({
  fileName,
  editPass,
  setEditPass,
  fileRegistry,
  serverRawCache,
  applyFileContent,
  setFileSha,
  acquireLock,
  releaseLock,
  startKeepAlive,
  stopKeepAlive,
  refreshTree,
  askPassword,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const handleToggleEditMode = useCallback(async () => {
    if (isEditing) {
      stopKeepAlive();
      if (editPass && fileName) releaseLock(fileName, editPass);
      setIsEditing(false);
      return;
    }

    const registryEntry = fileRegistry.current[fileName?.toLowerCase()];
    const isLocalNew    = registryEntry === null;

    if (isLocalNew) {
      setIsEditing(true);
      return;
    }

    try {
      const pass     = await askPassword();
      const lockData = await acquireLock(fileName, pass);

      if (lockData.ok && lockData.content) {
        const freshContent   = decodeBase64(lockData.content);
        const currentContent = (serverRawCache.current[fileName] || '').trim();

        if (freshContent.trim() !== currentContent && currentContent !== '') {
          const confirmUpdate = window.confirm(
            'This file has been updated on GitHub. Do you want to load the latest version? (Your local draft will be overwritten)'
          );
          if (confirmUpdate) {
            try { localStorage.removeItem(`vault_v3::${fileName}`); } catch {}
            serverRawCache.current[fileName] = freshContent;
            applyFileContent(fileName, freshContent);
          }
        } else {
          serverRawCache.current[fileName] = freshContent;
          try { localStorage.removeItem(`vault_v3::${fileName}`); } catch {}
          applyFileContent(fileName, freshContent);
        }

        if (lockData.sha) setFileSha(lockData.sha);
      }

      await refreshTree();

      setEditPass(pass);
      try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}
      setIsEditing(true);
      startKeepAlive(fileName, pass);
    } catch (e) {
      if (e.message === 'cancelled') return;
      if (e.message === 'wrong_pass') {
        alert('Incorrect password!');
      } else {
        alert('Cannot edit right now. File might be locked by another user.');
      }
    }
  }, [
    isEditing, fileName, editPass, setEditPass,
    fileRegistry, serverRawCache, applyFileContent,
    setFileSha, acquireLock, releaseLock, startKeepAlive, stopKeepAlive,
    refreshTree, askPassword,
  ]);

  return { isEditing, setIsEditing, handleToggleEditMode };
}
