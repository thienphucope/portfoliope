"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import Chat from '../../../features/case/components/Chat';
import { readCache } from '../../../features/case/components/BlockEditor';
import BlockEditor from '../../../features/case/components/BlockEditor';
import FileSystemItem from '../../../features/case/components/FileSystemItem';
import VaultStyles from '../../../features/case/components/VaultStyles';
import StickySpine from '../../../features/case/components/StickySpine';
import MobileFooter from '../../../features/case/components/MobileFooter';
import PromptOverlays from '../../../features/case/components/PromptOverlays';
import FloatingActions from '../../../features/case/components/FloatingActions';
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

const GraphView = dynamic(() => import('../../../features/case/components/GraphView'), { ssr: false });

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────

export default function CaseClient({ staticRecords = [] }) {
  // ── Core content state ──────────────────────────────────────────────────────
  const [content,      setContent]      = useState('');
  const [fileName,     setFileName]     = useState('');
  const [contentKey,   setContentKey]   = useState(0);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeOverlay,      setActiveOverlay]      = useState(null); // 'filetree' | 'chat' | null
  const [showHeader,         setShowHeader]          = useState(true);
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

  // ── File Loader ─────────────────────────────────────────────────────────────
  const {
    openFiles, setOpenFiles,
    activeTab, setActiveTab,
    fileSha,   setFileSha,
    loadFile,
  } = useFileLoader({ fileRegistry, serverRawCache, applyFileContent });

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
    const initContent = `# ${title}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`;
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

  // ── Content Cache (graph view) ───────────────────────────────────────────────
  const { fullContentCache } = useContentCache({ allFiles, serverRawCache });

  // ── Scroll Behaviour ─────────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    const base = [
      { id: 'filetree', title: 'File Tree', type: 'sidebar' },
      { id: 'chat',     title: 'AI Chat Vault', type: 'chat' },
    ];
    staticRecords.forEach((f) => base.push({ id: f.id, title: f.name.replace('.md', ''), type: 'static', content: f.content }));

    if (fileTree.length === 0) {
      for (let i = 0; i < 20; i++) base.push({ id: `placeholder-${i}`, title: '...', type: 'placeholder' });
      return base;
    }

    const sorted = [...allFiles].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((f) => base.push({ id: f.id, title: f.name.replace('.md', ''), type: 'editor', fileData: f }));
    return base;
  }, [allFiles, fileTree.length, staticRecords]);

  const { scrollToTab } = useScrollBehavior({ appShellRef, tabs, setShowHeader });

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
    staticRecords, applyFileContent,
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
    (async () => {
      try {
        const rawTree = await fetch('/api/cases', { cache: 'no-store' }).then((r) => r.json());
        if (!Array.isArray(rawTree)) { setContent(`# API Error\n${rawTree.error || 'Unknown'}`); return; }

        const repoPathMap = buildRegistry(rawTree);
        setFileTree(rawTree);

        const pathParts    = window.location.pathname.split('/').filter(Boolean);
        const rawDefault   = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || 'chat';
        const cleanDefault = rawDefault.replace(/\.md$/, '');

        let targetSlug = cleanDefault;
        if (pathParts[0] === 'case' && pathParts.length > 1) {
          targetSlug = decodeURIComponent(pathParts.slice(1).join('/'));
        }

        const cleanTarget  = targetSlug.replace(/\.md$/, '');
        const forceTab     = (cleanTarget === 'chat' || cleanTarget === 'filetree') ? cleanTarget : null;
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
            const staticMatch = staticRecords.find((r) => r.id.replace('system::', '').toLowerCase() === lowerTarget);
            if (staticMatch) {
              setActiveTab(staticMatch.id);
              applyFileContent(staticMatch.id, staticMatch.content);
            } else {
              const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
              const defUrl  = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
              if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', true);
            }
          }
        }, 500);
      } catch (e) {
        console.error('Initialization error:', e);
        setContent('# Connection Error\nFailed to connect to API.');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Internal wiki link resolution ────────────────────────────────────────────
  const resolveWikiPath = (target) => {
    const withExt = target.endsWith('.md') ? target : `${target}.md`;
    return withExt.includes('/') ? withExt : `notes/${withExt}`;
  };

  const handleLinkClick = useCallback((e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (href?.startsWith('#')) return;
    }

    const internalLink = e.target.closest('.internal-link');
    if (!internalLink) return;

    e.preventDefault();
    const target     = internalLink.getAttribute('data-target') || internalLink.innerText;
    const serverPath = resolveWikiPath(target);
    const key        = serverPath.toLowerCase();
    const baseName   = serverPath.split('/').pop().toLowerCase();
    const realPath   = fileRegistry.current[key] ?? fileRegistry.current[baseName];

    if (typeof realPath === 'string') {
      const existing = tabs.find((t) => t.fileData?.path === realPath);
      if (existing) loadFile(realPath, existing.fileData.name, existing.id);
      else          loadFile(realPath, serverPath.split('/').pop(), serverPath);
    } else if (realPath === null) {
      setActiveTab(serverPath);
      const openF  = openFiles.find((f) => f.id === serverPath);
      const cached = readCache(serverPath);
      const raw    = Array.isArray(cached) && cached.length > 0
        ? cached.map((b) => b.raw).join('\n\n')
        : openF?.fetchedContent;
      applyFileContent(serverPath, raw || `# ${serverPath.split('/').pop().replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`);
    } else {
      createAndOpenFile(target);
    }
  }, [loadFile, createAndOpenFile, openFiles, tabs, applyFileContent, fileRegistry, setActiveTab]);

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
      fetchedContent: fullContentCache[f.id] || openFiles.find((of) => of.id === f.id)?.fetchedContent || '',
    })),
    [allFiles, fullContentCache, openFiles]
  );

  const activeTabIndex    = tabs.findIndex((t) => t.id === activeTab);
  const nextTabForActive  = tabs.slice(activeTabIndex + 1).find((t) => t.type === 'editor' || t.type === 'static');
  const showReadMore      = isAtBottom && !isFooterExpanded && nextTabForActive && !activeOverlay;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        'accordion-app',
        activeTab || activeOverlay      ? 'has-active'      : '',
        activeOverlay === 'filetree'    ? 'filetree-active' : '',
        activeOverlay === 'chat'        ? 'chat-active'     : '',
      ].join(' ')}
      ref={appShellRef}
    >
      <div className="case-background" />
      <div className="video-overlay" />

      <MobileFooter
        isFooterExpanded={isFooterExpanded}
        setIsFooterExpanded={setIsFooterExpanded}
        showReadMore={showReadMore}
        activeOverlay={activeOverlay}
        setActiveOverlay={setActiveOverlay}
        handleCreateNewNote={handleCreateNewNote}
        fileName={fileName}
        handleAppendComment={handleAppendComment}
        handleTabClick={handleTabClick}
        nextTabForActive={nextTabForActive}
      />

      <StickySpine
        showHeader={showHeader}
        activeTab={activeTab}
        activeOverlay={activeOverlay}
        handleCreateNewNote={handleCreateNewNote}
        setActiveOverlay={setActiveOverlay}
      />

      {tabs.map((tab) => {
        const isOverlay    = tab.id === 'filetree' || tab.id === 'chat';
        const isOpen       = isOverlay ? activeOverlay === tab.id : activeTab === tab.id;
        const isPersistent = tab.id === 'chat' || tab.id === activeTab;

        return (
          <div
            key={tab.id}
            className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-${tab.id}`}
            data-tab-id={tab.id}
          >
            <div className="acc-spine-container" onClick={(e) => handleTabClick(tab, e)}>
              <div className="acc-spine">{tab.title}</div>
              {isOpen && (
                <div
                  className="mobile-back-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    isOverlay ? setActiveOverlay(null) : window.history.back();
                  }}
                >
                  <ArrowLeft size={24} />
                </div>
              )}
            </div>

            {(isOpen || isPersistent) && (
              <div
                className="acc-content"
                onClick={(e) => e.stopPropagation()}
                style={!isOpen ? { display: 'none' } : {}}
              >
                <FloatingActions
                  tab={tab}
                  isEditing={isEditing}
                  handleToggleEditMode={handleToggleEditMode}
                  saveStatus={saveStatus}
                  handleSidebarSave={handleSidebarSave}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  showSearch={showSearch}
                  setShowSearch={setShowSearch}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />

                <div className="acc-body">
                  {tab.type === 'sidebar' && (
                    <>
                      {viewMode === 'list' ? (
                        <div className="file-list" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                          {filteredTree.map((item, i) => (
                            <FileSystemItem
                              key={i}
                              item={item}
                              onSelectFile={loadFile}
                              activeFile={fileName}
                              onRename={handleRenameFile}
                              onDelete={handleDeleteFile}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <GraphView
                            allFiles={graphFiles}
                            onSelectFile={loadFile}
                            searchTerm={searchTerm}
                            activeNodeId={fileName}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {tab.type === 'chat' && (
                    <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
                      <Chat isEmbedded={true} onLinkClick={handleLinkClick} />
                    </div>
                  )}

                  {(tab.type === 'static' || tab.type === 'editor') && (
                    <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <article
                        className="markdown-container"
                        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                        onScroll={(e) => {
                          const t      = e.target;
                          const bottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 100;
                          if (bottom !== isAtBottom) setIsAtBottom(bottom);
                        }}
                      >
                        <BlockEditor
                          key={contentKey}
                          content={content}
                          fileName={fileName}
                          onLinkClick={handleLinkClick}
                          onSaveFile={handleSaveFile}
                          isEditing={tab.type === 'editor' ? isEditing : false}
                          readOnly={tab.type === 'static'}
                          onToggleEditing={handleToggleEditMode}
                          onSaveRef={saveHandlerRef}
                          fileRegistry={fileRegistry.current}
                        />
                      </article>

                      {tab.type === 'editor' && (
                        <div
                          className="comment-trigger"
                          onClick={handleAppendComment}
                          title="Add comment"
                          style={{
                            position: 'absolute', bottom: '30px', right: '30px',
                            width: '60px', height: '60px', borderRadius: '50%',
                            backgroundColor: 'var(--colorone)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 200,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', color: 'black',
                          }}
                        >
                          <Pencil size={28} />
                        </div>
                      )}
                    </main>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <PromptOverlays
        passPrompt={passPrompt}       setPassPrompt={setPassPrompt}
        namePrompt={namePrompt}       setNamePrompt={setNamePrompt}
        commentPrompt={commentPrompt} setCommentPrompt={setCommentPrompt}
      />

      <VaultStyles />
    </div>
  );
}