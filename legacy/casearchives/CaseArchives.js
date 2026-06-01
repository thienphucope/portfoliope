"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DEFAULT_VAULT_FILE } from '@/configs/vault';
import { ArrowLeft } from 'lucide-react';
import BlockEditor from '@/features/casearchives/components/BlockEditor';
import BaseStyles from '@/features/casearchives/styles/BaseStyles';
import TabPanelStyles from '@/features/casearchives/styles/TabPanelStyles';
import PromptOverlays from '@/features/casearchives/components/PromptOverlays';
import WindowFrame from '@/features/casearchives/components/WindowFrame';
import dynamic from 'next/dynamic';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useFileRegistry }     from '@/features/casearchives/hooks/useFileRegistry';
import { useFileLoader }       from '@/features/casearchives/hooks/useFileLoader';
import { useFileMutations }    from '@/features/casearchives/hooks/useFileMutations';
import { useLockManager }      from '@/features/casearchives/hooks/useLockManager';
import { useEditorState }      from '@/features/casearchives/hooks/useEditorState';
import { useScrollBehavior }   from '@/features/casearchives/hooks/useScrollBehavior';
import { useContentCache }     from '@/features/casearchives/hooks/useContentCache';
import { usePrompts }          from '@/features/casearchives/hooks/usePrompts';
import { useLinkHandler }      from '@/features/casearchives/hooks/useLinkHandler';

import { useReader } from '@/features/casearchives/hooks/useReader';
import { Volume2, VolumeX, Play, Pause, Square, Zap } from 'lucide-react';
import { useGraphData } from '@/features/casearchives/hooks/useGraphData';

const GraphView = dynamic(() => import('@/features/casearchives/components/GraphView'), { ssr: false });


// ─── Spritz Overlay Component ────────────────────────────────────────────────
const SpritzOverlay = ({ text, isPlaying, isPaused, playbackRate }) => {
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    const w = text.split(/\s+/).filter(Boolean);
    setWords(w);
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (!isPlaying || isPaused || playbackRate !== 4.0 || index >= words.length) return;
    const word = words[index] || "";
    const baseDuration = 110; 
    const extra = (word.length > 8 ? 40 : 0) + (/[.,!?;]/.test(word) ? 60 : 0);
    const timer = setTimeout(() => { setIndex(i => i + 1); }, baseDuration + extra);
    return () => clearTimeout(timer);
  }, [index, words, isPlaying, isPaused, playbackRate]);

  if (playbackRate !== 4.0 || !isPlaying || words.length === 0) return null;

  return (
    <div className="spritz-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--background, #000)', color: 'var(--theme, #FFFACD)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, userSelect: 'none' }}>
      <div className="spritz-word" style={{ fontSize: '6vw', fontWeight: '400', fontFamily: 'var(--font-mono)', textAlign: 'center', letterSpacing: '-0.02em', textTransform: 'lowercase' }}>
        {words[index] || words[words.length - 1]}
      </div>
    </div>
  );
};

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────
const PDFViewer = dynamic(() => import('@/features/casearchives/components/PDFViewer'), { ssr: false });
const ChatRoom = dynamic(() => import('@/features/chatroom/ChatRoom'), { ssr: false });

export default function CaseClient({ serverHydratedData = null }) {
  const reader = useReader();
  const [pendingReadConfirm, setPendingReadConfirm] = useState(null);
  const triggerRead = useCallback((e, onConfirm) => {
    if (reader.isPlaying) return;
    setPendingReadConfirm(() => onConfirm);
    setTimeout(() => { setPendingReadConfirm(prev => (prev === onConfirm ? null : prev)); }, 5000);
  }, [reader.isPlaying]);

  const augmentedReader = useMemo(() => ({ ...reader, triggerRead }), [reader, triggerRead]);

  const [content,      setContent]      = useState('');
  const [fileName,     setFileName]     = useState('');
  const [contentKey,   setContentKey]   = useState(0);
  const [activeOverlay,      setActiveOverlay]      = useState(null); 
  const [isEditorOpen,       setIsEditorOpen]       = useState(false);
  const [isChatOpen,         setIsChatOpen]         = useState(false);
  const [maximizedWindow,    setMaximizedWindow]    = useState(null);
  const [isLiveCallActive,   setIsLiveCallActive]   = useState(false);
  const lastPdfStateRef = useRef({ pageNumber: 1, file: null, fitMode: 'width' });
  const [pdfState,           setPdfState]           = useState(null);
  const handlePdfStateChange = useCallback((state) => {
    lastPdfStateRef.current = { ...lastPdfStateRef.current, ...state };
    setPdfState(prev => {
      if (prev?.pageNumber === state.pageNumber && prev?.numPages === state.numPages && prev?.fitMode === state.fitMode && prev?.file === state.file) return prev;
      return state;
    });
  }, []);
  
  const chatRef = useRef(null);
  const pdfRef = useRef(null);

  const closeEditorWindow = useCallback(() => {
    setIsEditorOpen(false);
    setIsChatOpen(false);
    setMaximizedWindow(null);
    setActiveTab(null);
    setEditorView('note');
    window.history.replaceState({}, '', '/');
  }, []);

  const toggleMaximize = useCallback(() => { setMaximizedWindow(prev => prev ? null : 'editor'); }, []);

  const [isAtBottom,         setIsAtBottom]          = useState(false);
  const [searchTerm,         setSearchTerm]          = useState('');
  const [showSearch,         setShowSearch]          = useState(false);
  const [viewMode,           setViewMode]            = useState('graph'); 
const [zoomToNodeId,       setZoomToNodeId]        = useState(null);
  const [editorView,         setEditorView]          = useState('note');

  const [editPass, setEditPass] = useState(() => { try { return sessionStorage.getItem('vault_edit_pass') || ''; } catch { return ''; } });
  const appShellRef  = useRef(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));
  const scrollPosMap = useRef({});
  const markdownContainerRef = useRef(null);
  const serverGraphRef = useRef(serverHydratedData?.graph || { nodes: [], links: [] });

  const applyFileContent = useCallback((repoKey, newContent) => {
    React.startTransition(() => { setFileName(repoKey); setContent(newContent); setContentKey((k) => k + 1); setIsAtBottom(false); });
  }, []);

  const { passPrompt, setPassPrompt, namePrompt, setNamePrompt, commentPrompt, setCommentPrompt, askPassword, askFileName, askComment } = usePrompts();
  const { fileTree, setFileTree, fileRegistry, serverRawCache, buildRegistry, refreshTree, registerLocalFile, insertFileIntoTree } = useFileRegistry();

  const getAllFiles = useCallback((nodes, repoPath = '') => {
    let files = [];
    nodes.forEach((n) => {
      if (n.kind === 'file') files.push({ id: repoPath ? `${repoPath}/${n.name}` : n.name, name: n.name, path: n.path });
      else if (n.children) files = files.concat(getAllFiles(n.children, repoPath ? `${repoPath}/${n.name}` : n.name));
    });
    return files;
  }, []);

  const allFiles = useMemo(() => getAllFiles(fileTree), [fileTree, getAllFiles]);

  const syncServerStructures = useCallback(({ tree, registry, graph }) => {
    if (Array.isArray(tree)) { setFileTree(tree); if (registry && typeof registry === 'object') fileRegistry.current = registry; else buildRegistry(tree); }
    if (graph && typeof graph === 'object') serverGraphRef.current = graph;
  }, [setFileTree, fileRegistry, buildRegistry]);

  const { fullContentCache, setFullContentCache, initializeFromServer, upsertCacheEntry } = useContentCache({ serverRawCache });
  const { openFiles, setOpenFiles, activeTab, setActiveTab, fileSha, setFileSha, loadFile: _loadFile } = useFileLoader({ fileRegistry, serverRawCache, upsertCacheEntry, syncServerStructures, applyFileContent, setActiveOverlay });

  const loadFile = useCallback((...args) => { setIsEditorOpen(true); return _loadFile(...args); }, [_loadFile]);
  const onLockLost = useCallback(() => { setIsEditing(false); alert('Connection lost or file locked by another user. Returning to view mode.'); }, []);
  const { acquireLock, releaseLock, startKeepAlive, stopKeepAlive } = useLockManager({ sessionIdRef, onLockLost });

  const createAndOpenFile = useCallback((target) => {
    const withExt = target.endsWith('.md') ? target : `${target}.md`;
    const serverPath = withExt.includes('/') ? withExt : `notes/${withExt}`;
    const displayName = serverPath.split('/').pop();
    const title = displayName.replace('.md', '');
    registerLocalFile(serverPath, displayName, target); insertFileIntoTree(serverPath);
    try { localStorage.removeItem(`vault_v3::${serverPath}`); } catch {}
    const initContent = `# ${title}\n*author: Ope*\n*tag: #content*\n*links:*\n`;
    applyFileContent(serverPath, initContent);
    setOpenFiles((prev) => { if (!prev.find((f) => f.id === serverPath)) return [...prev, { id: serverPath, path: null, name: displayName, serverPath, fetchedContent: initContent }]; return prev; });
    setActiveTab(serverPath); setActiveOverlay(null);
  }, [applyFileContent, registerLocalFile, insertFileIntoTree, setOpenFiles, setActiveTab]);

  const { saveStatus, saveHandlerRef, handleSaveFile, handleSidebarSave, handleRenameFile: _handleRenameFile, handleDeleteFile: _handleDeleteFile, handleCreateNewNote: _handleCreateNewNote, handleAppendComment } = useFileMutations({ sessionIdRef, fileRegistry, serverRawCache, setFullContentCache, fileSha, setFileSha, editPass, setEditPass, fileName, content, setContent, setOpenFiles, setContentKey, applyFileContent, createAndOpenFile, refreshTree, acquireLock, releaseLock, askPassword, askFileName, askComment });

  const handleRenameFile = useCallback((oldPath) => _handleRenameFile(oldPath, fileName, loadFile), [_handleRenameFile, fileName, loadFile]);
  const handleDeleteFile = useCallback((filePath) => _handleDeleteFile(filePath, fileName, (wasActive) => { if (wasActive) { setActiveTab(null); window.history.replaceState({ repoKey: null }, '', '/'); } else { const url = fileRegistry.current[fileName?.toLowerCase()]; if (url) loadFile(url, fileName.split('/').pop(), fileName, 'replace'); } }), [_handleDeleteFile, fileName, loadFile, fileRegistry, setActiveTab]);
  const handleCreateNewNote = useCallback(() => _handleCreateNewNote(setIsEditing, setActiveTab, startKeepAlive), [_handleCreateNewNote, setActiveTab, startKeepAlive]);
  const { isEditing, setIsEditing, handleToggleEditMode } = useEditorState({ fileName, editPass, setEditPass, fileRegistry, serverRawCache, applyFileContent, setFileSha, acquireLock, releaseLock, startKeepAlive, stopKeepAlive, refreshTree, askPassword });

  const [editSubMode, setEditSubMode] = useState('inline');
  const editMode = isEditing ? editSubMode : 'view';

  const handleCycleEditMode = useCallback(async () => {
    if (!isEditing) {
      setEditSubMode('inline');
      await handleToggleEditMode();
    } else if (editSubMode === 'inline') {
      setEditSubMode('raw');
    } else {
      await handleToggleEditMode();
    }
  }, [isEditing, editSubMode, handleToggleEditMode]);

  useEffect(() => {
    if (!isEditing) setEditSubMode('inline');
  }, [isEditing]);

  const tabs = useMemo(() => {
    const base = [ { id: 'chat', title: 'AI Chat Vault', type: 'chat' }, { id: 'pdf', title: 'PDF Reader', type: 'pdf' }, { id: 'graph', title: 'Graph View', type: 'static' } ];
    if (fileTree.length === 0) { for (let i = 0; i < 20; i++) base.push({ id: `placeholder-${i}`, title: '...', type: 'placeholder' }); return base; }
    const sorted = [...allFiles].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((f) => base.push({ id: f.id, title: f.name.replace('.md', ''), type: 'editor', fileData: f }));
    return base;
  }, [allFiles, fileTree.length]);

  const { scrollToTab, resetScroll } = useScrollBehavior({ appShellRef, tabs });
  useEffect(() => { if (activeTab && !activeOverlay) scrollToTab(activeTab); }, [activeTab, activeOverlay, scrollToTab]);

  useEffect(() => {
    const lastProcessedKey = { current: null };
    const onPop = (e) => {
      const isRoot = window.location.pathname === '/';
      if (isRoot) { setIsEditorOpen(false); setIsChatOpen(false); setActiveTab(null); setActiveOverlay(null); return; }
      const repoKey = e.state?.repoKey || null;
      if (lastProcessedKey.current === repoKey) return;
      lastProcessedKey.current = repoKey;
      if (!repoKey) { setActiveTab(null); setActiveOverlay(null); return; }
      setActiveOverlay(null);
      const realPath = fileRegistry.current[repoKey.toLowerCase()];
      if (realPath) loadFile(realPath, repoKey.split('/').pop(), repoKey, 'none');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [fileRegistry, loadFile, setActiveTab, setActiveOverlay]);


  useEffect(() => {
    document.body.classList.add('case-header-hidden');
    return () => document.body.classList.remove('case-header-hidden');
  }, []);

  useEffect(() => {
    const checkBottom = () => {
      const container = document.querySelector('.acc-panel.open .markdown-container');
      setIsAtBottom(container ? container.scrollHeight - container.scrollTop <= container.clientHeight + 100 : false);
    };
    const t = setTimeout(checkBottom, 400); return () => clearTimeout(t);
  }, [content, activeTab, activeOverlay, tabs.length]);

  useEffect(() => {
    if (!fileName || !markdownContainerRef.current) return;
    const saved = scrollPosMap.current[fileName] || 0;
    markdownContainerRef.current.scrollTop = saved;
  }, [fileName, contentKey]);

  useEffect(() => {
    if (window.location.pathname === '/' && !window.history.state) window.history.replaceState({ isRoot: true }, '', '/');
    const initialize = (data) => {
      const repoPathMap = buildRegistry(data.tree); setFileTree(data.tree); initializeFromServer(data.contentCache || {}, data.rawCache || {});
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const rawDefault = DEFAULT_VAULT_FILE;
      const cleanDefault = rawDefault.replace(/\.md$/, '');
      const isCaseRoot = pathParts.length === 0;
      let targetSlug = cleanDefault; if (pathParts.length > 0) targetSlug = decodeURIComponent(pathParts.join('/'));
      const cleanTarget = targetSlug.replace(/\.md$/, '');
      const forceTab = isCaseRoot ? null : ((cleanTarget === 'chat' || cleanTarget === 'pdf' || cleanTarget === 'graph') ? cleanTarget : null);
      const lowerTarget = cleanTarget.toLowerCase(); const actualRepo = repoPathMap[lowerTarget] || repoPathMap[lowerTarget + '.md'];
      const githubUrl = fileRegistry.current[lowerTarget] || fileRegistry.current[lowerTarget + '.md'];
      if (forceTab) {
        const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
        const defUrl = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
        if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', isCaseRoot);
        if (forceTab === 'chat') setIsChatOpen(true);
        else if (forceTab === 'pdf') setEditorView('pdf');
        else if (forceTab === 'graph') setEditorView('graph');
      } else if (actualRepo && githubUrl && !isCaseRoot) { loadFile(githubUrl, actualRepo.split('/').pop(), actualRepo, 'replace', true); }
      else if (!isCaseRoot) {
        const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
        const defUrl = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
        if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', true);
      }
    };
    if (serverHydratedData) initialize(serverHydratedData);
    else {
      (async () => {
        try {
          const bootRes = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bootstrap' }) });
          const boot = await bootRes.json(); if (bootRes.ok && boot?.ok && Array.isArray(boot.tree)) initialize(boot);
          else setContent(`# API Error\n${boot?.error || 'Unknown'}`);
        } catch (e) { console.error('Initialization error:', e); setContent('# Connection Error\nFailed to connect to API.'); }
      })();
    }
  }, []);

  const { handleLinkClick } = useLinkHandler({ loadFile, createAndOpenFile, openFiles, tabs, applyFileContent, fileRegistry, setActiveTab, setActiveOverlay });
  const contentCacheRef = useRef(fullContentCache);
  contentCacheRef.current = fullContentCache; // sync during render, no effect needed
  const graphFiles = useMemo(() => allFiles.map((f) => ({ ...f, fetchedContent: contentCacheRef.current[f.id]?.raw || '' })), [allFiles]);
  const { nodes: graphNodes } = useGraphData({ allFiles: graphFiles, fullContentCache });

  const activeTabPanel = useMemo(() => {
    const activeT = tabs.find(t => t.id === activeTab); if (!activeT) return null;
    return (
      <article ref={markdownContainerRef} className="markdown-container" style={{ flex: 1, overflowY: editMode === 'raw' ? 'hidden' : 'auto', overflowX: 'hidden', ...(editMode === 'raw' && { display: 'flex', flexDirection: 'column' }) }} onScroll={(e) => { const t = e.target; if (fileName) scrollPosMap.current[fileName] = t.scrollTop; const bottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 100; if (bottom !== isAtBottom) setIsAtBottom(bottom); }}>
        <div className="note-content-wrapper" style={editMode === 'raw' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : undefined}>
          {fileName === activeT.id ? (
            <BlockEditor content={content} fileName={fileName} onLinkClick={handleLinkClick} onSaveFile={handleSaveFile} editMode={activeT.type === 'editor' ? editMode : 'view'} readOnly={activeT.type === 'static'} onToggleEditing={handleCycleEditMode} onSaveRef={saveHandlerRef} fileRegistry={fileRegistry.current} reader={augmentedReader} />
          ) : (
            <div className="loading-placeholder" style={{ padding: '2rem', opacity: 0.5 }}>Loading...</div>
          )}
        </div>
      </article>
    );
  }, [activeTab, tabs, editMode, handleCycleEditMode, fileName, content, handleSaveFile, saveHandlerRef, fileRegistry, isAtBottom, augmentedReader, handleLinkClick]);

  return (
    <div className={['accordion-app pc-layout', activeTab ? 'has-active' : '', !isEditorOpen ? 'feed-active' : ''].join(' ')} ref={appShellRef}>
      <div className="case-background"><img src="/casebg2.png" alt="" /></div>
      <div className="video-overlay" />
      <SpritzOverlay text={reader.currentText} isPlaying={reader.isPlaying} isPaused={reader.isPaused} playbackRate={reader.playbackRate} />

      <>
          {isEditorOpen && !maximizedWindow && (
            <div onClick={closeEditorWindow} style={{ position: 'absolute', inset: 0, zIndex: 9 }} />
          )}

          {isEditorOpen && (
            <div className={`windows-container has-editor ${maximizedWindow ? 'has-maximized' : ''}`} style={{ width: '100vw', height: '100vh', margin: 0, display: 'flex', flexDirection: 'row' }}>

              {(() => {
                const isMax = !!maximizedWindow;
                const tabTitle = tabs.find(t => t.id === activeTab)?.title || 'Note';
                const mainContent = editorView === 'graph'
                  ? <GraphView allFiles={graphFiles} onSelectFile={(path, name, id) => { const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md']; if (githubUrl) loadFile(githubUrl, name, id, 'push', true); }} activeNodeId={activeTab} zoomToNodeId={zoomToNodeId} onZoomComplete={() => setZoomToNodeId(null)} />
                  : editorView === 'pdf'
                    ? <div className="pdf-container"><PDFViewer ref={pdfRef} onClose={() => setEditorView('note')} reader={augmentedReader} isOpen={true} onStateChange={handlePdfStateChange} initialFile={lastPdfStateRef.current.file} initialPage={lastPdfStateRef.current.pageNumber} initialFitMode={lastPdfStateRef.current.fitMode} /></div>
                    : activeTabPanel;
                const editorContent = (
                  <div style={{ display: 'flex', height: '100%', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>{mainContent}</div>
                    {isChatOpen && (
                      <div style={{ width: '50%', flexShrink: 0, borderLeft: '1px solid var(--theme)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="chat-container" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                          <ChatRoom ref={chatRef} isEmbedded={true} onLinkClick={handleLinkClick} onLiveCallChange={setIsLiveCallActive} />
                        </div>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className="window-frame-wrapper" style={isMax ? {} : { flex: 1, height: '100%' }}>
                    <WindowFrame
                      id="editor"
                      title={`Case Archives - ${tabTitle}`}
                      isMaximized={isMax}
                      isHidden={false}
                      onToggleMaximize={toggleMaximize}
                      onClose={closeEditorWindow}
                      onSave={handleSidebarSave}
                      saveStatus={saveStatus}
                      onToggleEdit={handleCycleEditMode}
                      editMode={editMode}
                      onComment={handleAppendComment}
                      onNewNote={handleCreateNewNote}
                      isMobile={false}
                      allFiles={graphNodes}
                      onSelectFile={(f) => {
                        if (f.type === 'tag') { setEditorView('graph'); setZoomToNodeId(f.id); return; }
                        const githubUrl = fileRegistry.current[f.id.toLowerCase()] || fileRegistry.current[f.id.toLowerCase() + '.md'];
                        if (githubUrl) loadFile(githubUrl, f.name, f.id, 'push', true);
                      }}
                      onLiveCall={isChatOpen ? () => chatRef.current?.toggleLiveCall() : null}
                      isLiveCallActive={isLiveCallActive}
                      pdfState={editorView === 'pdf' ? pdfState : null}
                      onPdfPrev={() => pdfRef.current?.prevPage()}
                      onPdfNext={() => pdfRef.current?.nextPage()}
                      onPdfUpload={() => pdfRef.current?.upload()}
                      onPdfToggleFit={() => pdfRef.current?.toggleFit()}
                      onPdfPageJump={(p) => pdfRef.current?.setPage(p)}
                      isGraphActive={editorView === 'graph'}
                      isPdfActive={editorView === 'pdf'}
                      isChatActive={isChatOpen}
                      onToggleGraph={() => setEditorView(v => v === 'graph' ? 'note' : 'graph')}
                      onTogglePdf={() => setEditorView(v => v === 'pdf' ? 'note' : 'pdf')}
                      onToggleChat={() => setIsChatOpen(v => !v)}
                    >
                      {editorContent}
                    </WindowFrame>
                  </div>
                );
              })()}

            </div>
          )}
        </>

      {(pendingReadConfirm || reader.isPlaying) && (
        <div className="global-reader-bar" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', borderRadius: '40px', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', border: '1px solid var(--theme, #FFFACD)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,250,205,0.2)', animation: 'fadeInDown 0.3s ease-out', color: 'white', transition: 'all 0.3s ease' }}>
          {pendingReadConfirm ? ( <div className="reader-confirm-btn" onClick={() => { pendingReadConfirm(); setPendingReadConfirm(null); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}><Volume2 size={20} color="var(--theme, #FFFACD)" /></div> ) : (
            <>
              <div className="reader-ctrl-btn" onClick={() => reader.isPaused ? reader.resume() : reader.pause()} title={reader.isPaused ? "Resume" : "Pause"} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{reader.isPaused ? ( <Play size={20} fill="var(--theme, #FFFACD)" color="var(--theme, #FFFACD)" /> ) : ( <Pause size={20} fill="var(--theme, #FFFACD)" color="var(--theme, #FFFACD)" /> )}</div>
              <div className="reader-ctrl-btn" onClick={() => reader.stop()} title="Stop" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Square size={18} fill="white" color="white" /></div>
              <div className="reader-speed-toggle" onClick={() => { const rates = [1.0, 1.25, 1.5, 2.0]; let next; if (reader.playbackRate === 4.0) next = 1.0; else if (reader.playbackRate === 2.0) next = reader.isPaused ? 4.0 : 1.0; else { const idx = rates.indexOf(reader.playbackRate); next = idx === -1 ? 1.0 : rates[(idx + 1) % rates.length]; } reader.setSpeed(next); }} style={{ cursor: 'pointer', fontSize: '0.92rem', fontWeight: '800', color: reader.playbackRate === 4.0 ? '#FF4500' : 'var(--theme, #FFFACD)', background: reader.playbackRate === 4.0 ? 'rgba(255,69,0,0.2)' : 'rgba(255,250,205,0.1)', padding: '4px 10px', borderRadius: '12px', minWidth: '45px', textAlign: 'center', userSelect: 'none', transition: 'all 0.3s ease' }}>{reader.playbackRate}x</div>
              <div className="reader-cefr-toggle" onClick={() => { const levels = ['none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2']; const idx = levels.indexOf(reader.cefrLevel); const next = levels[(idx + 1) % levels.length]; reader.updateCefrLevel(next); }} title="Learning English Level" style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: '900', color: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.4)' : '#000', background: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.05)' : 'var(--theme, #FFFACD)', padding: '4px 8px', borderRadius: '10px', minWidth: '40px', textAlign: 'center', userSelect: 'none', textTransform: 'uppercase', border: reader.cefrLevel === 'none' ? '1px solid rgba(255,250,205,0.1)' : 'none' }}>{reader.cefrLevel === 'none' ? 'Off' : reader.cefrLevel}</div>
            </>
          )}
          <style dangerouslySetInnerHTML={{ __html: ` .reader-ctrl-btn { opacity: 0.8; transition: all 0.2s; } .reader-ctrl-btn:hover { opacity: 1; transform: scale(1.1); } .reader-speed-toggle:hover { background: rgba(255,250,205,0.2); } .reader-cefr-toggle { transition: all 0.2s; } .reader-cefr-toggle:hover { transform: scale(1.05); filter: brightness(1.1); } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } `}} />
        </div>
      )}
      <PromptOverlays passPrompt={passPrompt} setPassPrompt={setPassPrompt} namePrompt={namePrompt} setNamePrompt={setNamePrompt} commentPrompt={commentPrompt} setCommentPrompt={setCommentPrompt} />
      <BaseStyles />
      <TabPanelStyles />
    </div>
  );
}
