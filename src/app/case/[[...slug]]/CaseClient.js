"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import BlockEditor from '../../../features/case/components/BlockEditor';
import VaultStyles from '../../../features/case/styles/VaultStyles';
import StickySpine from '../../../features/case/components/StickySpine';
import FunctionBall from '../../../features/case/components/FunctionBall';
import PromptOverlays from '../../../features/case/components/PromptOverlays';
import TabPanel from '../../../features/case/components/TabPanel';
import FileTreeOverlay from '../../../features/case/components/FileTreeOverlay';
import ChatOverlay from '../../../features/case/components/ChatOverlay';
import PDFOverlay from '../../../features/case/components/PDFOverlay';
import dynamic from 'next/dynamic';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useFileRegistry }     from '@/features/case/hooks/useFileRegistry';
import { useFileLoader }       from '@/features/case/hooks/useFileLoader';
import { useFileMutations }    from '@/features/case/hooks/useFileMutations';
import { useLockManager }      from '@/features/case/hooks/useLockManager';
import { useEditorState }      from '@/features/case/hooks/useEditorState';
import { useTabManager }       from '@/features/case/hooks/useTabManager';
import { useScrollBehavior }   from '@/features/case/hooks/useScrollBehavior';
import { useContentCache }     from '@/features/case/hooks/useContentCache';
import { useVideoInteraction } from '@/features/case/hooks/useVideoInteraction';
import { useBeforeUnload }     from '@/features/case/hooks/useBeforeUnload';
import { usePrompts }          from '@/features/case/hooks/usePrompts';
import { useLinkHandler }      from '@/features/case/hooks/useLinkHandler';

import { useReader } from '@/features/case/hooks/useReader';
import { Volume2, VolumeX, Play, Pause, Square, Zap } from 'lucide-react';

const GraphView = dynamic(() => import('../../../features/case/components/GraphView'), { ssr: false });

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────

export default function CaseClient({ serverHydratedData = null }) {
  const reader = useReader();
  const [pendingReadConfirm, setPendingReadConfirm] = useState(null); // onConfirm function

  const triggerRead = useCallback((e, onConfirm) => {
    // Nếu đang chơi rồi thì thôi
    if (reader.isPlaying) return;

    setPendingReadConfirm(() => onConfirm);

    // Tự lặn sau 5s nếu không click
    setTimeout(() => {
      setPendingReadConfirm(prev => (prev === onConfirm ? null : prev));
    }, 5000);
  }, [reader.isPlaying]);

  // Extend reader object with our new trigger
  const augmentedReader = useMemo(() => ({
    ...reader,
    triggerRead
  }), [reader, triggerRead]);

  // ── Core content state ──────────────────────────────────────────────────────
  const [content,      setContent]      = useState('');
  const [fileName,     setFileName]     = useState('');
  const [contentKey,   setContentKey]   = useState(0);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeOverlay,      setActiveOverlay]      = useState(null); // 'filetree' | 'chat' | 'pdf' | null
  const [showHeader,         setShowHeader]          = useState(true);
  const [showFunctionBall,   setShowFunctionBall]    = useState(true);
  const [isFooterExpanded,   setIsFooterExpanded]    = useState(false);
  const [isAtBottom,         setIsAtBottom]          = useState(false);
  const [searchTerm,         setSearchTerm]          = useState('');
  const [showSearch,         setShowSearch]          = useState(false);
  const [viewMode,           setViewMode]            = useState('graph'); // 'list' | 'graph'

  // ── Auth ────────────────────────────────────────────────────────────────────
  const [editPass, setEditPass] = useState(() => {
    try { return sessionStorage.getItem('vault_edit_pass') || ''; } catch { return ''; }
  });

  // ── Refs ────────────────────────────────────────────────────────────────────
  const appShellRef  = useRef(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));
  const serverGraphRef = useRef(serverHydratedData?.graph || { nodes: [], links: [] });

  // ── Stable content setter ───────────────────────────────────────────────────
  const applyFileContent = useCallback((repoKey, newContent) => {
    React.startTransition(() => {
      setFileName(repoKey);
      setContent(newContent);
      setContentKey((k) => k + 1);
      setIsAtBottom(false);
    });
  }, []);

  // ── Prompts ─────────────────────────────────────────────────────────────────
  const {
    passPrompt,    setPassPrompt,
    namePrompt,    setNamePrompt,
    commentPrompt, setCommentPrompt,
    askPassword, askFileName, askComment,
  } = usePrompts();

  // ── File Registry & Tree ────────────────────────────────────────────────────
  const {
    fileTree, setFileTree,
    fileRegistry, serverRawCache,
    buildRegistry, refreshTree,
    registerLocalFile, insertFileIntoTree,
  } = useFileRegistry();

  // ── Computed file list ───────────────────────────────────────────────────────
  const getAllFiles = useCallback((nodes, repoPath = '') => {
    let files = [];
    nodes.forEach((n) => {
      if (n.kind === 'file') {
        files.push({ id: repoPath ? `${repoPath}/${n.name}` : n.name, name: n.name, path: n.path });
      } else if (n.children) {
        files = files.concat(getAllFiles(n.children, repoPath ? `${repoPath}/${n.name}` : n.name));
      }
    });
    return files;
  }, []);

  const allFiles = useMemo(() => getAllFiles(fileTree), [fileTree, getAllFiles]);

  const syncServerStructures = useCallback(({ tree, registry, graph }) => {
    if (Array.isArray(tree)) {
      setFileTree(tree);
      if (registry && typeof registry === 'object') {
        fileRegistry.current = registry;
      } else {
        buildRegistry(tree);
      }
    }
    if (graph && typeof graph === 'object') {
      serverGraphRef.current = graph;
    }
  }, [setFileTree, fileRegistry, buildRegistry]);

  // ── Content Cache (with HTML caching) ───────────────────────────────────────
  const {
    fullContentCache,
    setFullContentCache,
    initializeFromServer,
    upsertCacheEntry,
  } = useContentCache({ serverRawCache });

  // ── File Loader (uses HTML cache for instant loading) ───────────────────────
  const {
    openFiles, setOpenFiles,
    activeTab, setActiveTab,
    fileSha,   setFileSha,
    loadFile,
  } = useFileLoader({ 
    fileRegistry, 
    serverRawCache, 
    upsertCacheEntry,
    syncServerStructures,
    applyFileContent, 
    setActiveOverlay 
  });

  // ── Lock Manager ────────────────────────────────────────────────────────────
  const onLockLost = useCallback(() => {
    setIsEditing(false);
    alert('Connection lost or file locked by another user. Returning to view mode.');
  }, []);

  const { acquireLock, releaseLock, startKeepAlive, stopKeepAlive } = useLockManager({
    sessionIdRef,
    onLockLost,
  });

  // ── Create-and-open (shared between mutations and editor) ───────────────────
  const createAndOpenFile = useCallback((target) => {
    const withExt    = target.endsWith('.md') ? target : `${target}.md`;
    const serverPath = withExt.includes('/') ? withExt : `notes/${withExt}`;
    const displayName = serverPath.split('/').pop();
    const title       = displayName.replace('.md', '');

    registerLocalFile(serverPath, displayName, target);
    insertFileIntoTree(serverPath);

    try { localStorage.removeItem(`vault_v3::${serverPath}`); } catch {}
    const initContent = `# ${title}\n*author: Ope*\n*tag: #content*\n*links:*\n`;
    applyFileContent(serverPath, initContent);

    setOpenFiles((prev) => {
      if (!prev.find((f) => f.id === serverPath)) {
        return [...prev, { id: serverPath, path: null, name: displayName, serverPath, fetchedContent: initContent }];
      }
      return prev;
    });
    setActiveTab(serverPath);
    setActiveOverlay(null);
  }, [applyFileContent, registerLocalFile, insertFileIntoTree, setOpenFiles, setActiveTab]);

  // ── File Mutations ──────────────────────────────────────────────────────────
  const {
    saveStatus, saveHandlerRef,
    handleSaveFile, handleSidebarSave,
    handleRenameFile: _handleRenameFile,
    handleDeleteFile: _handleDeleteFile,
    handleCreateNewNote: _handleCreateNewNote,
    handleAppendComment,
  } = useFileMutations({
    sessionIdRef, fileRegistry, serverRawCache,
    setFullContentCache,
    fileSha, setFileSha,
    editPass, setEditPass,
    fileName, content,
    setContent, setOpenFiles, setContentKey,
    applyFileContent, createAndOpenFile,
    refreshTree, acquireLock, releaseLock,
    askPassword, askFileName, askComment,
  });

  // Bind loadFile into rename/delete callbacks
  const handleRenameFile = useCallback(
    (oldPath) => _handleRenameFile(oldPath, fileName, loadFile),
    [_handleRenameFile, fileName, loadFile]
  );

  const handleDeleteFile = useCallback(
    (filePath) => _handleDeleteFile(filePath, fileName, (wasActive) => {
      if (wasActive) {
        setActiveTab(null);
        window.history.replaceState({ repoKey: null }, '', '/case');
      } else {
        const url = fileRegistry.current[fileName?.toLowerCase()];
        if (url) loadFile(url, fileName.split('/').pop(), fileName, 'replace');
      }
    }),
    [_handleDeleteFile, fileName, loadFile, fileRegistry, setActiveTab]
  );

  const handleCreateNewNote = useCallback(
    () => _handleCreateNewNote(setIsEditing, setActiveTab, startKeepAlive),
    [_handleCreateNewNote, setActiveTab, startKeepAlive]
  );

  // ── Editor State ─────────────────────────────────────────────────────────────
  const { isEditing, setIsEditing, handleToggleEditMode } = useEditorState({
    fileName, editPass, setEditPass,
    fileRegistry, serverRawCache,
    applyFileContent, setFileSha,
    acquireLock, releaseLock,
    startKeepAlive, stopKeepAlive,
    refreshTree, askPassword,
  });

  // ── Scroll Behaviour ─────────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    const base = [
      { id: 'filetree', title: 'File Tree', type: 'sidebar' },
      { id: 'chat',     title: 'AI Chat Vault', type: 'chat' },
      { id: 'pdf',      title: 'PDF Reader', type: 'pdf' },
    ];

    if (fileTree.length === 0) {
      for (let i = 0; i < 20; i++) base.push({ id: `placeholder-${i}`, title: '...', type: 'placeholder' });
      return base;
    }

    const sorted = [...allFiles].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((f) => base.push({ id: f.id, title: f.name.replace('.md', ''), type: 'editor', fileData: f }));
    return base;
  }, [allFiles, fileTree.length]);

  const { scrollToTab } = useScrollBehavior({ appShellRef, tabs, setShowHeader, setShowFunctionBall });

  useEffect(() => {
    if (activeTab && !activeOverlay) scrollToTab(activeTab);
  }, [activeTab, activeOverlay, scrollToTab]);

  // ── Tab Manager ──────────────────────────────────────────────────────────────
  const { handleTabClick, handlePopState } = useTabManager({
    tabs, activeTab, setActiveTab,
    activeOverlay, setActiveOverlay,
    isEditing, setIsEditing,
    fileName, content, editPass,
    serverRawCache, fileRegistry,
    applyFileContent,
    loadFile, handleSaveFile,
    releaseLock, stopKeepAlive,
    setShowSearch,
  });

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  // ── Video interaction glass break ────────────────────────────────────────────
  useVideoInteraction();

  // ── Dirty-draft before-unload guard ─────────────────────────────────────────
  useBeforeUnload({ serverRawCache });

  // ── Bottom-of-page detection ─────────────────────────────────────────────────
  useEffect(() => {
    const checkBottom = () => {
      const container = document.querySelector('.acc-panel.open .markdown-container');
      setIsAtBottom(container
        ? container.scrollHeight - container.scrollTop <= container.clientHeight + 100
        : false);
    };
    const t = setTimeout(checkBottom, 400);
    return () => clearTimeout(t);
  }, [content, activeTab, activeOverlay, tabs.length]);

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    // Đánh dấu đây là điểm dừng gốc của kho lưu trữ
    if (window.location.pathname === '/case' && !window.history.state) {
      window.history.replaceState({ isRoot: true }, '', '/case');
    }

    const initialize = (data) => {
      const repoPathMap = buildRegistry(data.tree);
      setFileTree(data.tree);
      initializeFromServer(data.contentCache || {}, data.rawCache || {});

      const pathParts    = window.location.pathname.split('/').filter(Boolean);
      const rawDefault   = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || 'chat';
      const cleanDefault = rawDefault.replace(/\.md$/, '');
      const isCaseRoot   = pathParts.length === 1 && pathParts[0] === 'case';

      let targetSlug = cleanDefault;
      if (pathParts[0] === 'case' && pathParts.length > 1) {
        targetSlug = decodeURIComponent(pathParts.slice(1).join('/'));
      }

      const cleanTarget  = targetSlug.replace(/\.md$/, '');
      const forceTab     = isCaseRoot
        ? 'filetree'
        : ((cleanTarget === 'chat' || cleanTarget === 'filetree' || cleanTarget === 'pdf') ? cleanTarget : null);
      const lowerTarget  = cleanTarget.toLowerCase();
      const actualRepo   = repoPathMap[lowerTarget] || repoPathMap[lowerTarget + '.md'];
      const githubUrl    = fileRegistry.current[lowerTarget] || fileRegistry.current[lowerTarget + '.md'];

      setTimeout(() => {
        if (forceTab) {
          setActiveOverlay(forceTab);
          const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
          const defUrl  = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
          if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', false);
        } else if (actualRepo && githubUrl) {
          loadFile(githubUrl, actualRepo.split('/').pop(), actualRepo, 'replace', true);
        } else {
          const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
          const defUrl  = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
          if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', true);
        }
      }, 300);
    };

    if (serverHydratedData) {
      initialize(serverHydratedData);
    } else {
      (async () => {
        try {
          const bootRes = await fetch('/api/cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bootstrap' }),
          });
          const boot = await bootRes.json();
          if (bootRes.ok && boot?.ok && Array.isArray(boot.tree)) {
            initialize(boot);
          } else {
            setContent(`# API Error\n${boot?.error || 'Unknown'}`);
          }
        } catch (e) {
          console.error('Initialization error:', e);
          setContent('# Connection Error\nFailed to connect to API.');
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { handleLinkClick } = useLinkHandler({
    loadFile,
    createAndOpenFile,
    openFiles,
    tabs,
    applyFileContent,
    fileRegistry,
    setActiveTab,
    setActiveOverlay,
  });

  // ── Filtered tree for sidebar ─────────────────────────────────────────────────
  const filteredTree = useMemo(() => {
    const filterNodes = (nodes, forceOpen = false) =>
      nodes.reduce((acc, node) => {
        const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (node.kind === 'directory' && node.children) {
          const children = filterNodes(node.children, forceOpen);
          if (children.length > 0 || matches || forceOpen) {
            acc.push({ ...node, children, isOpen: forceOpen || children.length > 0 || matches });
          }
        } else if (matches || !searchTerm) {
          acc.push(node);
        }
        return acc;
      }, []);

    return filterNodes(fileTree, activeOverlay === 'filetree' || !!searchTerm);
  }, [fileTree, searchTerm, activeOverlay]);

  const graphFiles = useMemo(() =>
    allFiles.map((f) => ({
      ...f,
      fetchedContent: fullContentCache[f.id]?.raw || openFiles.find((of) => of.id === f.id)?.fetchedContent || '',
    })),
    [allFiles, fullContentCache, openFiles]
  );

  const activeTabIndex    = tabs.findIndex((t) => t.id === activeTab);
  const nextTabForActive  = tabs.slice(activeTabIndex + 1).find((t) => t.type === 'editor' || t.type === 'static');
  const prevTabForActive  = activeTabIndex > 0 
    ? [...tabs.slice(0, activeTabIndex)].reverse().find((t) => t.type === 'editor' || t.type === 'static')
    : null;

  const showReadMore      = isAtBottom && !isFooterExpanded && nextTabForActive && !activeOverlay;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        'accordion-app',
        activeTab || activeOverlay      ? 'has-active'      : '',
        activeOverlay === 'filetree'    ? 'filetree-active' : '',
        activeOverlay === 'chat'        ? 'chat-active'     : '',
        activeOverlay === 'pdf'         ? 'pdf-active'      : '',
      ].join(' ')}
      ref={appShellRef}
    >
      <div className="case-background">
        <img src="/casebg2.png" alt="" />
      </div>
      <div className="video-overlay" />

      <FunctionBall
        isFooterExpanded={isFooterExpanded}
        setIsFooterExpanded={setIsFooterExpanded}
        showReadMore={showReadMore}
        showFunctionBall={showFunctionBall}
        isAtBottom={isAtBottom}
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        handleCreateNewNote={handleCreateNewNote}
        fileName={fileName}
        handleAppendComment={handleAppendComment}
        handleTabClick={handleTabClick}
        nextTabForActive={nextTabForActive}
        prevTabForActive={prevTabForActive}
        isEditing={isEditing}
        handleToggleEditMode={handleToggleEditMode}
        saveStatus={saveStatus}
        handleSidebarSave={handleSidebarSave}
        activeTabType={tabs.find(t => t.id === activeTab)?.type}
        activeTabObj={tabs.find(t => t.id === activeTab)}
      />

      <StickySpine
        showHeader={showHeader}
        activeTab={activeTab}
        activeOverlay={activeOverlay}
        handleCreateNewNote={handleCreateNewNote}
        setActiveOverlay={setActiveOverlay}
        setActiveTab={setActiveTab}
      />

      <FileTreeOverlay
        isOpen={activeOverlay === 'filetree'}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredTree={filteredTree}
        loadFile={loadFile}
        fileName={fileName}
        handleRenameFile={handleRenameFile}
        handleDeleteFile={handleDeleteFile}
        graphFiles={graphFiles}
        fullContentCache={fullContentCache}
      />

      <ChatOverlay
        isOpen={activeOverlay === 'chat'}
        handleLinkClick={handleLinkClick}
        reader={augmentedReader}
      />

      <PDFOverlay
        isOpen={activeOverlay === 'pdf'}
        setActiveOverlay={setActiveOverlay}
        reader={augmentedReader}
      />

      {tabs.filter(t => t.type === 'editor' || t.type === 'static').map(tab => (
        <TabPanel
          key={tab.id}
          tab={tab}
          activeTab={activeTab}
          handleTabClick={handleTabClick}
          handleLinkClick={handleLinkClick}
          isEditing={isEditing}
          handleToggleEditMode={handleToggleEditMode}
          saveStatus={saveStatus}
          handleSidebarSave={handleSidebarSave}
          fileName={fileName}
          content={content}
          handleSaveFile={handleSaveFile}
          saveHandlerRef={saveHandlerRef}
          fileRegistry={fileRegistry}
          isAtBottom={isAtBottom}
          setIsAtBottom={setIsAtBottom}
          reader={augmentedReader}
        />
      ))}

      {(pendingReadConfirm || reader.isPlaying) && (
        <div 
          className="global-reader-bar"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(16px)',
            borderRadius: '40px',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '18px',
            border: '1px solid var(--colorbutton, #FFFACD)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,250,205,0.2)',
            animation: 'fadeInDown 0.3s ease-out',
            color: 'white',
            transition: 'all 0.3s ease'
          }}
        >
          {pendingReadConfirm ? (
            <div 
              className="reader-confirm-btn"
              onClick={() => {
                pendingReadConfirm();
                setPendingReadConfirm(null);
              }}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <Volume2 size={20} color="var(--colorbutton, #FFFACD)" />
            </div>
          ) : (
            <>
              <div 
                className="reader-ctrl-btn"
                onClick={() => reader.isPaused ? reader.resume() : reader.pause()}
                title={reader.isPaused ? "Resume" : "Pause"}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {reader.isPaused ? (
                  <Play size={20} fill="var(--colorbutton, #FFFACD)" color="var(--colorbutton, #FFFACD)" />
                ) : (
                  <Pause size={20} fill="var(--colorbutton, #FFFACD)" color="var(--colorbutton, #FFFACD)" />
                )}
              </div>

              <div 
                className="reader-ctrl-btn"
                onClick={() => reader.stop()}
                title="Stop"
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Square size={18} fill="white" color="white" />
              </div>

              <div 
                className="reader-speed-toggle"
                onClick={() => {
                  const rates = [1.0, 1.25, 1.5, 2.0];
                  const idx = rates.indexOf(reader.playbackRate);
                  const next = rates[(idx + 1) % rates.length];
                  reader.setSpeed(next);
                }}
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '13px', 
                  fontWeight: '800', 
                  color: 'var(--colorbutton, #FFFACD)',
                  background: 'rgba(255,250,205,0.1)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  minWidth: '45px',
                  textAlign: 'center',
                  userSelect: 'none'
                }}
              >
                {reader.playbackRate}x
              </div>

              <div 
                className="reader-cefr-toggle"
                onClick={() => {
                  const levels = ['none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
                  const idx = levels.indexOf(reader.cefrLevel);
                  const next = levels[(idx + 1) % levels.length];
                  reader.updateCefrLevel(next);
                }}
                title="Learning English Level"
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '11px', 
                  fontWeight: '900', 
                  color: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.4)' : '#000',
                  background: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.05)' : 'var(--colorbutton, #FFFACD)',
                  padding: '4px 8px',
                  borderRadius: '10px',
                  minWidth: '40px',
                  textAlign: 'center',
                  userSelect: 'none',
                  textTransform: 'uppercase',
                  border: reader.cefrLevel === 'none' ? '1px solid rgba(255,250,205,0.1)' : 'none'
                }}
              >
                {reader.cefrLevel === 'none' ? 'Off' : reader.cefrLevel}
              </div>
            </>
          )}

          <style dangerouslySetInnerHTML={{ __html: `
            .reader-ctrl-btn { opacity: 0.8; transition: all 0.2s; }
            .reader-ctrl-btn:hover { opacity: 1; transform: scale(1.1); }
            .reader-speed-toggle:hover { background: rgba(255,250,205,0.2); }
            .reader-cefr-toggle { transition: all 0.2s; }
            .reader-cefr-toggle:hover { transform: scale(1.05); filter: brightness(1.1); }
            @keyframes fadeInDown {
              from { opacity: 0; transform: translate(-50%, -20px); }
              to { opacity: 1; transform: translate(-50%, 0); }
            }
          `}} />
        </div>
      )}

      <PromptOverlays
        passPrompt={passPrompt}       setPassPrompt={setPassPrompt}
        namePrompt={namePrompt}       setNamePrompt={setNamePrompt}
        commentPrompt={commentPrompt} setCommentPrompt={setCommentPrompt}
      />

      <VaultStyles />
    </div>
  );
}
