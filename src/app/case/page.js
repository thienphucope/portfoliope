"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chat from './components/Chat';
import { ensureLibsLoaded, postProcess, fitHeading } from './components/MarkdownEngine';
import FileSystemItem from './components/FileSystemItem';
import BlockEditor, { readCache } from './components/BlockEditor';
import VaultStyles from './components/VaultStyles';

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────

export default function CasePage() {
  const [fileTree,    setFileTree]    = useState([]);
  const [content,     setContent]     = useState('');
  const [fileName,    setFileName]    = useState('');
  const [contentKey,  setContentKey]  = useState(0);
  const [isEditing,   setIsEditing]   = useState(false);
  const [saveStatus,  setSaveStatus]  = useState('idle');
  const [editPass,    setEditPass]    = useState(() => { try { return sessionStorage.getItem('vault_edit_pass') || ''; } catch { return ''; } });
  const [passPrompt,  setPassPrompt]  = useState(null);
  const fileRegistry   = useRef({});
  const serverRawCache = useRef({});
  const appShellRef    = useRef(null);
  const saveHandlerRef = useRef(null); // ref to BlockEditor's save fn

  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [chatWidth,    setChatWidth]    = useState(350);
  const isResizingSidebar = useRef(false);
  const isResizingChat    = useRef(false);

  const isMobileView = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth <= 1024 || window.matchMedia('(orientation: portrait)').matches);

  const handleMouseMove = useCallback((e) => {
    if (isResizingSidebar.current) { const w = e.clientX;           if (w > 150 && w < 500) setSidebarWidth(w); }
    if (isResizingChat.current)    { const w = window.innerWidth - e.clientX; if (w > 250 && w < 600) setChatWidth(w); }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = isResizingChat.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  const startResizingSidebar = useCallback(() => {
    isResizingSidebar.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, stopResizing]);

  const startResizingChat = useCallback(() => {
    isResizingChat.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, [handleMouseMove, stopResizing]);

  const loadFile = useCallback(async (path, name, serverPath = null, historyMode = 'push') => {
    if (!path) {
      const key = serverPath || name;
      const cached = readCache(key);
      const raw = Array.isArray(cached) && cached.length > 0
        ? cached.map(b => b.raw).join('\n\n')
        : `# ${name.replace('.md', '')}\n`;
      setContent(raw);
      setFileName(key);
      setContentKey(k => k + 1);
      if (isMobileView() && appShellRef.current)
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'smooth' });
      return;
    }
    try {
      const res  = await fetch(path);
      const text = await res.text();
      const urlParts = new URL(path).pathname.split('/').slice(1);
      const repoKey = urlParts.slice(3).join('/');
      serverRawCache.current[repoKey] = text;
      setContent(text);
      setFileName(repoKey);
      setContentKey(k => k + 1);
      if (historyMode === 'push') {
        const u = new URL(window.location);
        u.searchParams.set('file', repoKey);
        window.history.pushState({ path, name: repoKey }, '', u);
      } else if (historyMode === 'replace') {
        const u = new URL(window.location);
        u.searchParams.set('file', repoKey);
        window.history.replaceState({ path, name: repoKey }, '', u);
      }
      if (isMobileView() && appShellRef.current)
        appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'smooth' });
    } catch { setContent('# Error\nFailed to load.'); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tree = await fetch('/api/cases').then(r => r.json());
        if (!Array.isArray(tree)) { setContent(`# API Error\n${tree.error || 'Unknown'}`); return; }
        const buildRegistry = (nodes, repoPath = '') => nodes.forEach(n => {
          if (n.kind === 'file') {
            const fullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
            fileRegistry.current[fullRepoPath.toLowerCase()] = n.path;
            fileRegistry.current[n.name.toLowerCase()] = n.path;
            fileRegistry.current[n.name.replace('.md', '').toLowerCase()] = n.path;
          } else if (n.children) {
            buildRegistry(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
          }
        });
        buildRegistry(tree);
        setFileTree(tree);
        const p = fileRegistry.current['dash board.md'];
        if (p) loadFile(p, 'Dash Board.md', null, 'replace');
      } catch { setContent('# Connection Error\nFailed to connect to API.'); }
    })();
  }, [loadFile]);

  useEffect(() => {
    const center = () => { if (isMobileView() && appShellRef.current) appShellRef.current.scrollTo({ left: appShellRef.current.clientWidth, behavior: 'instant' }); };
    center();
    window.addEventListener('resize', center);
    return () => window.removeEventListener('resize', center);
  }, []);

  useEffect(() => {
    const onPop = (e) => { if (e.state?.path) loadFile(e.state.path, e.state.name, null, 'none'); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [loadFile]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      const dirtyKeys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || !k.startsWith('vault_v3::')) continue;
          const fp = k.replace('vault_v3::', '');
          const cached = (() => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } })();
          if (!Array.isArray(cached) || cached.length === 0) continue;
          const cachedRaw = cached.map(b => b.raw).join('\n\n').trim();
          const serverRaw = (serverRawCache.current[fp] || "").trim();
          if (serverRaw && serverRaw !== cachedRaw) {
            dirtyKeys.push(k);
          }
        }
      } catch {}
      if (dirtyKeys.length === 0) return;

      e.preventDefault();
      e.returnValue = '';
      const flush = () => {
        dirtyKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
      };
      window.addEventListener('unload', flush, { once: true });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const refreshTree = useCallback(async () => {
    const tree = await fetch('/api/cases').then(r => r.json());
    if (!Array.isArray(tree)) return;
    const buildReg = (nodes, repoPath = '') => nodes.forEach(n => {
      if (n.kind === 'file') {
        const fullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
        fileRegistry.current[fullRepoPath.toLowerCase()] = n.path;
        fileRegistry.current[n.name.toLowerCase()] = n.path;
        fileRegistry.current[n.name.replace('.md','').toLowerCase()] = n.path;
      } else if (n.children) {
        buildReg(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
      }
    });
    buildReg(tree);
    setFileTree(tree);
  }, []);

  const resolveWikiPath = (target) => {
    const withExt = target.endsWith('.md') ? target : `${target}.md`;
    return withExt.includes('/') ? withExt : `notes/${withExt}`;
  };

  const createAndOpenFile = useCallback((target) => {
    const serverPath  = resolveWikiPath(target);
    const displayName = serverPath.split('/').pop();
    const title       = displayName.replace('.md', '');

    fileRegistry.current[serverPath.toLowerCase()] = null;
    fileRegistry.current[displayName.toLowerCase()] = null;
    fileRegistry.current[target.toLowerCase()] = null;

    const parts = serverPath.split('/');
    setFileTree(prev => {
      const insert = (nodes, [head, ...rest]) => {
        if (rest.length === 0) {
          if (nodes.some(n => n.name.toLowerCase() === head.toLowerCase())) return nodes;
          return [...nodes, { kind: 'file', name: head, path: null, isLocal: true }];
        }
        const folder = nodes.find(n => n.kind === 'directory' && n.name.toLowerCase() === head.toLowerCase());
        if (folder) return nodes.map(n => n === folder ? { ...n, children: insert(n.children || [], rest) } : n);
        return [...nodes, { kind: 'directory', name: head, isOpen: true, children: insert([], rest) }];
      };
      return insert(prev, parts);
    });

    try { localStorage.removeItem(`vault_v3::${serverPath}`); } catch {}
    setContent(`# ${title}\n`);
    setFileName(serverPath);
    setContentKey(k => k + 1);
  }, []);

  const handleLinkClick = useCallback((e) => {
    // Only handle [[internal-link]] wiki links, not external <a> tags
    const internalLink = e.target.closest('.internal-link');
    if (!internalLink) return;

    e.preventDefault();
    const target     = internalLink.getAttribute('data-target') || internalLink.innerText;
    const serverPath = resolveWikiPath(target);
    const key        = serverPath.toLowerCase();
    const baseName   = serverPath.split('/').pop().toLowerCase();
    const realPath   = fileRegistry.current[key] ?? fileRegistry.current[baseName];

    if (typeof realPath === 'string') {
      loadFile(realPath, serverPath.split('/').pop());
    } else if (realPath === null) {
      setFileName(serverPath);
    } else {
      createAndOpenFile(target);
    }
  }, [loadFile, createAndOpenFile]);

  const askPassword = useCallback(() => new Promise((resolve, reject) => {
    setPassPrompt({ resolve, reject });
  }), []);

  const doPost = useCallback(async (filePath, raw, pass) => {
    const isNew = fileRegistry.current[filePath.toLowerCase()] === null;
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content: raw, create: isNew, password: pass }),
    });
    if (res.status === 403) return { wrongPass: true };
    if (!res.ok) throw new Error(await res.text());
    if (isNew) await refreshTree();
    return { ok: true };
  }, [refreshTree]);

  const saveOneFile = useCallback(async (filePath, raw) => {
    const serverRaw = serverRawCache.current[filePath] ?? null;
    if (serverRaw !== null && serverRaw.trim() === raw.trim()) return;

    let pass = editPass;
    if (!pass) {
      pass = await askPassword();
      setEditPass(pass);
      try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}
    }
    const result = await doPost(filePath, raw, pass);
    if (result.wrongPass) {
      setEditPass('');
      try { sessionStorage.removeItem('vault_edit_pass', pass); } catch {}
      const newPass = await askPassword();
      setEditPass(newPass);
      try { sessionStorage.setItem('vault_edit_pass', newPass); } catch {}
      const retry = await doPost(filePath, raw, newPass);
      if (!retry.ok) throw new Error('Wrong password');
    }
  }, [editPass, askPassword, doPost]);

  const handleSaveFile = useCallback(async (raw) => {
    if (!fileName) throw new Error('No file open');
    await saveOneFile(fileName, raw);
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith('vault_v3::')) continue;
        const fp = k.replace('vault_v3::', '');
        if (fp === fileName) continue;
        const cached = readCache(fp);
        if (!Array.isArray(cached) || cached.length === 0) continue;
        const cachedRaw = cached.map(b => b.raw).join('\n\n');
        await saveOneFile(fp, cachedRaw);
      }
    } catch {}
  }, [fileName, saveOneFile]);

  // Sidebar-level save handler
  const handleSidebarSave = useCallback(async () => {
    if (!saveHandlerRef.current) return;
    setSaveStatus('saving');
    try {
      await saveHandlerRef.current();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  return (
    <div className="app-shell" ref={appShellRef}>

      {/* LEFT: FILE TREE */}
      <aside className="sidebar-panel" style={{ width: sidebarWidth }}>
        <div className="sidebar-brand">
          <span className="brand-text">RED VAULT</span>
          <div className="brand-actions">
            {/* Edit toggle icon */}
            <button
              className={`icon-btn${isEditing ? ' icon-btn--active' : ''}`}
              onClick={() => setIsEditing(e => !e)}
              title={isEditing ? 'Switch to Read mode' : 'Switch to Edit mode'}
            >
              {isEditing ? (
                // Eye icon (read mode)
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                // Pencil icon (edit mode)
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
            </button>
            {/* Save icon */}
            <button
              className={`icon-btn icon-btn--save${saveStatus === 'saved' ? ' icon-btn--saved' : saveStatus === 'error' ? ' icon-btn--error' : saveStatus === 'saving' ? ' icon-btn--saving' : ''}`}
              onClick={handleSidebarSave}
              disabled={saveStatus === 'saving'}
              title="Save"
            >
              {saveStatus === 'saving' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.5}}>
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.06-5.96"/>
                </svg>
              ) : saveStatus === 'saved' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : saveStatus === 'error' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="file-list">
          {fileTree.map((item, i) => <FileSystemItem key={i} item={item} onSelectFile={loadFile} activeFile={fileName} />)}
        </div>
      </aside>

      <div className="resizer" onMouseDown={startResizingSidebar}><div className="divider-line">||</div></div>

      {/* CENTER: BLOCK EDITOR */}
      <main className="main-content">
        <article className="markdown-container">
          <BlockEditor
            key={contentKey}
            content={content}
            fileName={fileName}
            onLinkClick={handleLinkClick}
            onSaveFile={handleSaveFile}
            isEditing={isEditing}
            onToggleEditing={() => setIsEditing(e => !e)}
            onSaveRef={saveHandlerRef}
          />
        </article>
      </main>

      <div className="resizer" onMouseDown={startResizingChat}><div className="divider-line">||</div></div>

      {/* RIGHT: CHAT */}
      <aside className="chat-panel" style={{ width: chatWidth }}>
        <div className="chat-container"><Chat isEmbedded={true} /></div>
      </aside>

      {/* PASSWORD MODAL */}
      {passPrompt && (
        <div className="pass-overlay" onClick={() => { passPrompt.reject(new Error('cancelled')); setPassPrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">🔐 Nhập mật khẩu để lưu</div>
            <input
              className="pass-modal__input"
              type="password"
              placeholder="Edit password…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (!val) return;
                  passPrompt.resolve(val);
                  setPassPrompt(null);
                }
                if (e.key === 'Escape') {
                  passPrompt.reject(new Error('cancelled'));
                  setPassPrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter để xác nhận · Esc để huỷ</div>
          </div>
        </div>
      )}

      <VaultStyles />
    </div>
  );
}