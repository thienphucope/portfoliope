import { useState, useRef, useCallback } from 'react';
import { decodeBase64 } from '../utils/encoding';
import { ensureLibsLoaded } from '../utils/markdown';

/**
 * All write operations: save, create, rename, delete, append comment.
 * Depends on: lock helpers, prompt helpers, registry, and content state.
 * Supports optimistic cache updates for instant UI feedback.
 */
export function useFileMutations({
  sessionIdRef,
  fileRegistry,
  serverRawCache,
  setFullContentCache,     // Callback to update cache
  fileSha,
  setFileSha,
  editPass,
  setEditPass,
  fileName,
  content,
  setContent,
  setOpenFiles,
  setContentKey,
  applyFileContent,
  createAndOpenFile,
  refreshTree,
  acquireLock,
  releaseLock,
  askPassword,
  askFileName,
  askComment,
}) {
  const [saveStatus, setSaveStatus] = useState('idle');
  const saveHandlerRef = useRef(null); // set by BlockEditor

  /** Update cache optimistically when content changes */
  const updateFileCache = useCallback((filePath, rawContent, htmlContent = null) => {
    setFullContentCache((prev) => ({
      ...prev,
      [filePath]: {
        raw: rawContent,
        html: htmlContent || prev?.[filePath]?.html || null,
        fetchedAt: Date.now(),
      },
    }));
  }, [setFullContentCache]);

  /** Render markdown to HTML and cache it */
  const renderAndCacheHtml = useCallback(async (filePath, rawContent) => {
    try {
      await ensureLibsLoaded();
      if (window.marked) {
        const html = window.marked.parse(rawContent);
        updateFileCache(filePath, rawContent, html);
        return html;
      }
    } catch (e) {
      console.error('Failed to render HTML for cache:', filePath, e);
    }
    updateFileCache(filePath, rawContent, null);
  }, [updateFileCache]);

  // ─── Low-level POST ────────────────────────────────────────────────────────

  const doPost = useCallback(
    async (filePath, raw, pass) => {
      const isNew = fileRegistry.current[filePath.toLowerCase()] === null;
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: raw,
          create: isNew,
          password: pass,
          sessionId: sessionIdRef.current,
          sha: fileSha,
        }),
      });

      if (res.status === 403) return { wrongPass: true };
      if (res.status === 423) throw new Error('locked_by_other');
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      if (data.sha) setFileSha(data.sha);

      // Update both raw caches
      serverRawCache.current[filePath] = raw;
      updateFileCache(filePath, raw);  // Update optimistically
      
      // Render HTML asynchronously
      setTimeout(() => renderAndCacheHtml(filePath, raw), 0);
      
      setContent(raw);
      try { localStorage.removeItem(`vault_v3::${filePath}`); } catch {}

      if (isNew) await refreshTree();
      return { ok: true };
    },
    [fileRegistry, fileSha, sessionIdRef, setFileSha, serverRawCache, setContent, refreshTree, updateFileCache, renderAndCacheHtml]
  );

  // ─── Save single file ──────────────────────────────────────────────────────

  const saveOneFile = useCallback(
    async (filePath, raw) => {
      const serverRaw = serverRawCache.current[filePath] ?? null;
      if (serverRaw !== null && serverRaw.trim() === raw.trim()) return;

      // No password prompt on save - only use current editPass (may be empty)
      const pass = editPass || '';

      const result = await doPost(filePath, raw, pass);
      if (result.wrongPass) {
        throw new Error('Incorrect password. Please edit the file first to authenticate.');
      }
    },
    [editPass, doPost, serverRawCache]
  );

  const handleSaveFile = useCallback(
    async (raw) => {
      if (!fileName) throw new Error('No file open');
      await saveOneFile(fileName, raw);
    },
    [fileName, saveOneFile]
  );

  /** Called by FloatingActions save button — delegates to BlockEditor's save ref */
  const handleSidebarSave = useCallback(async () => {
    if (!saveHandlerRef.current) return;
    setSaveStatus('saving');
    try {
      await saveHandlerRef.current();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      if (e.message === 'locked_by_other') {
        alert('Cannot save. File is locked by another user.');
      }
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  // ─── Rename ────────────────────────────────────────────────────────────────

  const handleRenameFile = useCallback(
    async (oldPath, currentFileName, loadFile) => {
      let newPath;
      try {
        newPath = await askFileName(oldPath, 'Rename/Move file (enter full path)');
      } catch {
        return;
      }
      if (!newPath || newPath === oldPath) return;

      try {
        const pass = editPass || (await askPassword());
        setEditPass(pass);
        try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}

        const lockData = await acquireLock(oldPath, pass);

        setSaveStatus('saving');
        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'rename',
            path: oldPath,
            newPath,
            password: pass,
            sessionId: sessionIdRef.current,
            sha: lockData.sha,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Rename failed');
        }

        // Apply server-authoritative updates only after rename succeeds.
        const removedFiles = Array.isArray(data.removedFiles) ? data.removedFiles : [oldPath];
        const changedFiles = data.changedFiles || {};

        for (const removedPath of removedFiles) {
          delete serverRawCache.current[removedPath];
        }
        for (const [changedPath, changedContent] of Object.entries(changedFiles)) {
          serverRawCache.current[changedPath] = changedContent;
          updateFileCache(changedPath, changedContent);
        }
        setFullContentCache((prev) => {
          const updated = { ...prev };
          for (const removedPath of removedFiles) delete updated[removedPath];
          return updated;
        });

        await refreshTree();

        if (currentFileName === oldPath) {
          const cleanPath = newPath.replace(/\.md$/, '');
          window.history.replaceState({ repoKey: newPath }, '', `/project/casearchives/${cleanPath}`);
          const newUrl = fileRegistry.current[newPath.toLowerCase()];
          if (newUrl) loadFile(newUrl, newPath.split('/').pop(), newPath, 'replace');
        } else {
          const url = fileRegistry.current[currentFileName?.toLowerCase()];
          if (url) loadFile(url, currentFileName.split('/').pop(), currentFileName, 'replace');
        }

        releaseLock(oldPath, pass);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        if (e.message === 'cancelled') return;
        alert('Error renaming: ' + e.message);
      }
    },
    [editPass, askPassword, setEditPass, acquireLock, releaseLock, refreshTree, fileRegistry, serverRawCache, sessionIdRef, updateFileCache, setFullContentCache]
  );

  // ─── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteFile = useCallback(
    async (filePath, currentFileName, onDeleted) => {
      if (!window.confirm(`Are you sure you want to delete "${filePath}"?`)) return;

      try {
        const pass = editPass || (await askPassword());
        setEditPass(pass);
        try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}

        const lockData = await acquireLock(filePath, pass);

        setSaveStatus('saving');
        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete',
            path: filePath,
            password: pass,
            sessionId: sessionIdRef.current,
            sha: lockData.sha,
          }),
        });
        if (!res.ok) throw new Error(await res.text());

        // Clear cache for deleted file
        delete serverRawCache.current[filePath];
        setFullContentCache((prev) => {
          const updated = { ...prev };
          delete updated[filePath];
          return updated;
        });

        await refreshTree();
        onDeleted?.(filePath === currentFileName);

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        if (e.message === 'cancelled') return;
        alert('Error deleting: ' + e.message);
      }
    },
    [editPass, askPassword, setEditPass, acquireLock, refreshTree, serverRawCache, sessionIdRef, setFullContentCache]
  );

  // ─── Create new note ───────────────────────────────────────────────────────

  const handleCreateNewNote = useCallback(
    async (setIsEditing, setActiveTab, startKeepAlive) => {
      let noteName;
      try {
        noteName = await askFileName();
      } catch {
        return;
      }
      if (!noteName) return;

      const cleanName  = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
      const targetPath = `notes/${cleanName}`;

      const exists =
        fileRegistry.current[targetPath.toLowerCase()] ||
        fileRegistry.current[cleanName.toLowerCase()] ||
        fileRegistry.current[noteName.toLowerCase()];

      if (exists) {
        alert(`Note "${noteName}" already exists!`);
        return;
      }

      try {
        const lockData = await acquireLock(targetPath, editPass);

        if (lockData.ok && lockData.content) {
          alert(`Note "${noteName}" already exists on the server!`);
          releaseLock(targetPath, editPass);
          return;
        }

        createAndOpenFile(targetPath);
        setFileSha(null);
        setIsEditing(true);
        setActiveTab(targetPath);
        startKeepAlive(targetPath, editPass);
      } catch (e) {
        if (e.message === 'locked_by_other') {
          alert('Cannot create. A file with this name is currently being edited by another user.');
        } else {
          createAndOpenFile(targetPath);
          setFileSha(null);
          setIsEditing(true);
          setActiveTab(targetPath);
        }
      }
    },
    [askFileName, editPass, acquireLock, releaseLock, createAndOpenFile, setFileSha, fileRegistry]
  );

  // ─── Append comment ────────────────────────────────────────────────────────

  const handleAppendComment = useCallback(
    async (initialValue = '') => {
      if (!fileName || fileName === 'chat') return;

      let comment;
      try {
        comment = await askComment(typeof initialValue === 'string' ? initialValue : '');
      } catch {
        return;
      }
      if (!comment) return;

      try {
        const pass = editPass || '';
        const lockData   = await acquireLock(fileName, pass);
        const freshContent = decodeBase64(lockData.content);
        const currentSha   = lockData.sha;

        const commentEntry   = `"${comment}"`;
        const detailsRegex   = /<details[^>]*>\s*<summary>\s*Comments\s*<\/summary>([\s\S]*?)<\/details>/i;
        const match          = freshContent.match(detailsRegex);

        let updatedContent;
        if (match) {
          const oldInner  = match[1].trim();
          const newInner  = `\n\n${commentEntry}\n${oldInner}\n\n`;
          const newBlock  = `<details>\n<summary>Comments</summary>${newInner}</details>`;
          updatedContent  = freshContent.substring(0, match.index) + newBlock + freshContent.substring(match.index + match[0].length);
        } else {
          updatedContent = `<details>\n<summary>Comments</summary>\n\n${commentEntry}\n\n</details>\n\n` + freshContent.trim();
        }

        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: fileName,
            content: updatedContent,
            password: pass,
            comment: true,
            sessionId: sessionIdRef.current,
            sha: currentSha,
          }),
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (data.sha) setFileSha(data.sha);

        serverRawCache.current[fileName] = updatedContent;
        updateFileCache(fileName, updatedContent);  // Update cache
        setOpenFiles((prev) =>
          prev.map((f) => (f.id === fileName ? { ...f, fetchedContent: updatedContent } : f))
        );
        setContent(updatedContent);
        setContentKey((k) => k + 1);
        try { localStorage.removeItem(`vault_v3::${fileName}`); } catch {}

        releaseLock(fileName, pass);
      } catch (e) {
        if (e.message === 'cancelled') return;
        if (e.message === 'locked_by_other') {
          alert('Cannot add comment. File is locked by another user.');
        } else {
          alert('Error adding comment: ' + e.message);
        }
        handleAppendComment(comment);
      }
    },
    [
      fileName, editPass, acquireLock, releaseLock, sessionIdRef,
      setFileSha, serverRawCache, setOpenFiles, setContent, setContentKey, askComment,
    ]
  );

  return {
    saveStatus,
    saveHandlerRef,
    handleSaveFile,
    handleSidebarSave,
    handleRenameFile,
    handleDeleteFile,
    handleCreateNewNote,
    handleAppendComment,
  };
}
