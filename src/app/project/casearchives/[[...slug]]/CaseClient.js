"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import BlockEditor from '@/features/project/casearchives/components/BlockEditor';
import VaultStyles from '@/features/project/casearchives/styles/VaultStyles';
import StickySpine from '@/features/project/casearchives/components/StickySpine';
import FunctionBall from '@/features/project/casearchives/components/FunctionBall';
import PromptOverlays from '@/features/project/casearchives/components/PromptOverlays';
import TabPanel from '@/features/project/casearchives/components/TabPanel';
import ChatOverlay from '@/features/project/casearchives/components/ChatOverlay';
import PDFOverlay from '@/features/project/casearchives/components/PDFOverlay';
import WindowFrame from '@/features/project/casearchives/components/WindowFrame';
import NoteGallery from '@/features/project/casearchives/components/NoteGallery';
import dynamic from 'next/dynamic';
import AudioVisualProvider, { useAudioVisual } from '@/components/audio/AudioVisualProvider';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useFileRegistry }     from '@/features/project/casearchives/hooks/useFileRegistry';
import { useFileLoader }       from '@/features/project/casearchives/hooks/useFileLoader';
import { useFileMutations }    from '@/features/project/casearchives/hooks/useFileMutations';
import { useLockManager }      from '@/features/project/casearchives/hooks/useLockManager';
import { useEditorState }      from '@/features/project/casearchives/hooks/useEditorState';
import { useTabManager }       from '@/features/project/casearchives/hooks/useTabManager';
import { useScrollBehavior }   from '@/features/project/casearchives/hooks/useScrollBehavior';
import { useContentCache }     from '@/features/project/casearchives/hooks/useContentCache';
import { useVideoInteraction } from '@/features/project/casearchives/hooks/useVideoInteraction';
import { useBeforeUnload }     from '@/features/project/casearchives/hooks/useBeforeUnload';
import { usePrompts }          from '@/features/project/casearchives/hooks/usePrompts';
import { useLinkHandler }      from '@/features/project/casearchives/hooks/useLinkHandler';
import { useWindowResizer }    from '@/features/project/casearchives/hooks/useWindowResizer';

import { useReader } from '@/features/project/casearchives/hooks/useReader';
import { Volume2, VolumeX, Play, Pause, Square, Zap } from 'lucide-react';
import { useGraphData } from '@/features/project/casearchives/hooks/useGraphData';

const GraphView = dynamic(() => import('@/features/project/casearchives/components/GraphView'), { ssr: false });

// ─── Graph Window Wrapper ───────────────────────────────────────────────────
const GraphWindowWrapper = ({
  winId, title, isMaximized, isHidden, toggleMaximize, closeWindow,
  winContent, isLiveCallActive, chatRef, pdfState, pdfRef,
  allFiles, fileRegistry, loadFile, graphFiles, fullContentCache, setZoomToNodeId,
  isPinned, onTogglePin
}) => {
  const { nodes: graphNodes } = useGraphData({ allFiles: graphFiles, fullContentCache });
  
  const handleSelect = (f) => {
    if (f.type === 'tag') {
      setZoomToNodeId(f.id);
    } else {
      const githubUrl = fileRegistry.current[f.id.toLowerCase()] || fileRegistry.current[f.id.toLowerCase() + '.md'];
      if (githubUrl) loadFile(githubUrl, f.name, f.id, 'push', true);
      setZoomToNodeId(f.id);
    }
  };

  return (
    <WindowFrame 
      id={winId} 
      title={title} 
      isMaximized={isMaximized} 
      isHidden={isHidden} 
      onToggleMaximize={toggleMaximize} 
      onClose={closeWindow} 
      onLiveCall={winId === 'chat' ? () => chatRef.current?.toggleLiveCall() : null} 
      isLiveCallActive={winId === 'chat' ? isLiveCallActive : false} 
      pdfState={winId === 'pdf' ? pdfState : null} 
      onPdfPrev={() => pdfRef.current?.prevPage()} 
      onPdfNext={() => pdfRef.current?.nextPage()} 
      onPdfUpload={() => pdfRef.current?.upload()} 
      onPdfToggleFit={() => pdfRef.current?.toggleFit()} 
      onPdfPageJump={(p) => pdfRef.current?.setPage(p)} 
      isMobile={false}
      isPinned={isPinned}
      onTogglePin={onTogglePin}
      allFiles={winId === 'graph' ? graphNodes : (winId === 'editor' ? allFiles : [])}
      onSelectFile={handleSelect}
    >
      {winContent}
    </WindowFrame>
  );
};

// ─── Mobile Graph Overlay ─────────────────────────────────────────────────────
const GraphOverlay = ({ isOpen, graphFiles, activeTab, loadFile, fileRegistry, fullContentCache }) => {
  if (!isOpen) return null;
  return (
    <div className={`acc-panel open tab-graph`} data-tab-id="graph">
      <div className="acc-content" onClick={(e) => e.stopPropagation()}>
        <div className="acc-body">
          <GraphView 
            allFiles={graphFiles} 
            onSelectFile={(path, name, id) => {
              const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md'];
              if (githubUrl) {
                loadFile(githubUrl, name, id, 'push', true);
              }
            }}
            activeNodeId={activeTab}
            fullContentCache={fullContentCache}
          />
        </div>
      </div>
    </div>
  );
};

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
    <div className="spritz-overlay" style={{ position: 'fixed', inset: 0, background: 'var(--colortab, #000)', color: 'var(--colorbutton, #FFFACD)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, userSelect: 'none' }}>
      <div className="spritz-word" style={{ fontSize: '6vw', fontWeight: '400', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '-0.02em', textTransform: 'lowercase' }}>
        {words[index] || words[words.length - 1]}
      </div>
    </div>
  );
};

// ─── Music Player Component ──────────────────────────────────────────────────
const MusicPlayer = ({ isPlaying, isPaused, playbackRate }) => {
  const iframeRef = useRef(null);
  useEffect(() => {
    if (playbackRate === 4.0 && isPlaying && !isPaused && iframeRef.current) {
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [50] }), '*');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isPaused, playbackRate]);
  if (playbackRate !== 4.0 || !isPlaying) return null;
  return (
    <div style={{ width: 0, height: 0, overflow: 'hidden', position: 'absolute', pointerEvents: 'none' }}>
      <iframe ref={iframeRef} width="560" height="315" src={`https://www.youtube.com/embed/c7O91GDWGPU?autoplay=1&loop=1&playlist=c7O91GDWGPU&controls=0&showinfo=0&autohide=1&enablejsapi=1${isPaused ? '&mute=1' : ''}`} title="YouTube music player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin"></iframe>
    </div>
  );
};

const GalleryDisk = () => {
  const av = useAudioVisual();
  if (!av) return <div className="gallery-nav-disk" />;
  const { isPlaying, videoTitle, togglePlayPause, handleDiskMouseEnter, handleDiskMouseLeave, animationKey, animationClass } = av;
  return (
    <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
      <div className={`gallery-nav-disk${!isPlaying ? ' paused' : ''}`} />
      {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass}`} style={{ fontFamily: 'var(--font-display)' }}>{videoTitle}</span>}
    </div>
  );
};

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────
const PDFViewer = dynamic(() => import('@/features/project/casearchives/components/PDFViewer'), { ssr: false });
const Chat = dynamic(() => import('@/features/project/casearchives/components/Chat'), { ssr: false });

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
  const [openWindows,        setOpenWindows]        = useState([]);
  const [maximizedWindow,    setMaximizedWindow]    = useState(null);
  const [everOpened,         setEverOpened]         = useState([]);
  const [pinnedWindows,      setPinnedWindows]      = useState([]);
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

  useEffect(() => {
    setEverOpened(prev => {
      const next = [...prev]; let changed = false;
      openWindows.forEach(id => { if (!next.includes(id)) { next.push(id); changed = true; } });
      return changed ? next : prev;
    });
  }, [openWindows]);

  const toggleWindow = useCallback((id) => {
    setOpenWindows(prev => {
      if (prev.includes(id)) { return prev.filter(w => w !== id); }
      return [...prev, id];
    });
    setMaximizedWindow(null);
  }, []);

  const closeWindow = useCallback((id) => {
    window.history.back();
  }, []);

  const toggleMaximize = useCallback((id) => { setMaximizedWindow(prev => prev === id ? null : id); }, []);
  const togglePin = useCallback((id) => { setPinnedWindows(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]); }, []);

  const [showHeader,         setShowHeader]          = useState(true);
  const [showFunctionBall,   setShowFunctionBall]    = useState(true);
  const [isFooterExpanded,   setIsFooterExpanded]    = useState(false);
  const [isAtBottom,         setIsAtBottom]          = useState(false);
  const [searchTerm,         setSearchTerm]          = useState('');
  const [showSearch,         setShowSearch]          = useState(false);
  const [viewMode,           setViewMode]            = useState('graph'); 
  const [isMobile,           setIsMobile]            = useState(false);
  const [zoomToNodeId,       setZoomToNodeId]        = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile(); window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [editPass, setEditPass] = useState(() => { try { return sessionStorage.getItem('vault_edit_pass') || ''; } catch { return ''; } });
  const appShellRef  = useRef(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));
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

  const loadFile = useCallback((...args) => { if (!isMobile) setOpenWindows(prev => prev.includes('editor') ? prev : [...prev, 'editor']); return _loadFile(...args); }, [_loadFile, isMobile]);
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
  const handleDeleteFile = useCallback((filePath) => _handleDeleteFile(filePath, fileName, (wasActive) => { if (wasActive) { setActiveTab(null); window.history.replaceState({ repoKey: null }, '', '/project/casearchives'); } else { const url = fileRegistry.current[fileName?.toLowerCase()]; if (url) loadFile(url, fileName.split('/').pop(), fileName, 'replace'); } }), [_handleDeleteFile, fileName, loadFile, fileRegistry, setActiveTab]);
  const handleCreateNewNote = useCallback(() => _handleCreateNewNote(setIsEditing, setActiveTab, startKeepAlive), [_handleCreateNewNote, setActiveTab, startKeepAlive]);
  const { isEditing, setIsEditing, handleToggleEditMode } = useEditorState({ fileName, editPass, setEditPass, fileRegistry, serverRawCache, applyFileContent, setFileSha, acquireLock, releaseLock, startKeepAlive, stopKeepAlive, refreshTree, askPassword });

  const tabs = useMemo(() => {
    const base = [ { id: 'chat', title: 'AI Chat Vault', type: 'chat' }, { id: 'pdf', title: 'PDF Reader', type: 'pdf' }, { id: 'graph', title: 'Graph View', type: 'static' } ];
    if (fileTree.length === 0) { for (let i = 0; i < 20; i++) base.push({ id: `placeholder-${i}`, title: '...', type: 'placeholder' }); return base; }
    const sorted = [...allFiles].sort((a, b) => a.name.localeCompare(b.name));
    sorted.forEach((f) => base.push({ id: f.id, title: f.name.replace('.md', ''), type: 'editor', fileData: f }));
    return base;
  }, [allFiles, fileTree.length]);

  const { scrollToTab } = useScrollBehavior({ appShellRef, tabs, setShowHeader, setShowFunctionBall });
  useEffect(() => { if (activeTab && !activeOverlay) scrollToTab(activeTab); }, [activeTab, activeOverlay, scrollToTab]);

  const { handleTabClick, handlePopState } = useTabManager({ tabs, activeTab, setActiveTab, activeOverlay, setActiveOverlay, isEditing, setIsEditing, fileName, content, editPass, serverRawCache, fileRegistry, applyFileContent, loadFile, handleSaveFile, releaseLock, stopKeepAlive, setShowSearch });
  useEffect(() => {
    const onPop = (e) => {
      const isRoot = window.location.pathname === '/project/casearchives';
      if (isRoot) {
        setOpenWindows([]);
        setActiveTab(null);
        setActiveOverlay(null);
      } else {
        handlePopState(e);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [handlePopState]);

  useVideoInteraction();
  useBeforeUnload({ serverRawCache });

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
    if (window.location.pathname === '/project/casearchives' && !window.history.state) window.history.replaceState({ isRoot: true }, '', '/project/casearchives');
    const initialize = (data) => {
      const repoPathMap = buildRegistry(data.tree); setFileTree(data.tree); initializeFromServer(data.contentCache || {}, data.rawCache || {});
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      const rawDefault = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || 'chat';
      const cleanDefault = rawDefault.replace(/\.md$/, '');
      const isCaseRoot = pathParts.length === 2 && pathParts[0] === 'project' && pathParts[1] === 'casearchives';
      let targetSlug = cleanDefault; if (pathParts[0] === 'project' && pathParts[1] === 'casearchives' && pathParts.length > 2) targetSlug = decodeURIComponent(pathParts.slice(2).join('/'));
      const cleanTarget = targetSlug.replace(/\.md$/, '');
      const forceTab = isCaseRoot ? null : ((cleanTarget === 'chat' || cleanTarget === 'pdf' || cleanTarget === 'graph') ? cleanTarget : null);
      const lowerTarget = cleanTarget.toLowerCase(); const actualRepo = repoPathMap[lowerTarget] || repoPathMap[lowerTarget + '.md'];
      const githubUrl = fileRegistry.current[lowerTarget] || fileRegistry.current[lowerTarget + '.md'];
      setTimeout(() => {
        if (forceTab) {
          const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
          const defUrl = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
          if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', isCaseRoot);
          if (!isMobile) toggleWindow(forceTab); else setActiveOverlay(forceTab);
        } else if (actualRepo && githubUrl && !isCaseRoot) { loadFile(githubUrl, actualRepo.split('/').pop(), actualRepo, 'replace', true); }
        else if (!isCaseRoot) {
          const defRepo = repoPathMap[cleanDefault.toLowerCase()] || repoPathMap[cleanDefault.toLowerCase() + '.md'];
          const defUrl = fileRegistry.current[cleanDefault.toLowerCase()] || fileRegistry.current[cleanDefault.toLowerCase() + '.md'];
          if (defRepo && defUrl) loadFile(defUrl, defRepo.split('/').pop(), defRepo, 'replace', true);
        }
      }, 300);
    };
    if (serverHydratedData) initialize(serverHydratedData);
    else {
      (async () => {
        try {
          const bootRes = await fetch('/api/project/casearchivess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'bootstrap' }) });
          const boot = await bootRes.json(); if (bootRes.ok && boot?.ok && Array.isArray(boot.tree)) initialize(boot);
          else setContent(`# API Error\n${boot?.error || 'Unknown'}`);
        } catch (e) { console.error('Initialization error:', e); setContent('# Connection Error\nFailed to connect to API.'); }
      })();
    }
  }, []);

  const { handleLinkClick } = useLinkHandler({ loadFile, createAndOpenFile, openFiles, tabs, applyFileContent, fileRegistry, setActiveTab, setActiveOverlay });
  const graphFiles = useMemo(() => allFiles.map((f) => ({ ...f, fetchedContent: fullContentCache[f.id]?.raw || openFiles.find((of) => of.id === f.id)?.fetchedContent || '', })), [allFiles, fullContentCache, openFiles]);

  const activeTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const nextTabForActive = tabs.slice(activeTabIndex + 1).find((t) => t.type === 'editor' || t.type === 'static');
  const prevTabForActive = activeTabIndex > 0 ? [...tabs.slice(0, activeTabIndex)].reverse().find((t) => t.type === 'editor' || t.type === 'static') : null;
  const showReadMore = isAtBottom && !isFooterExpanded && nextTabForActive && !activeOverlay;

  const activeTabPanel = useMemo(() => {
    const activeT = tabs.find(t => t.id === activeTab); if (!activeT) return null;
    return (
      <TabPanel key={activeT.id} tab={activeT} activeTab={activeTab} handleTabClick={handleTabClick} handleLinkClick={handleLinkClick} isEditing={isEditing} handleToggleEditMode={handleToggleEditMode} saveStatus={saveStatus} handleSidebarSave={handleSidebarSave} fileName={fileName} content={content} handleSaveFile={handleSaveFile} saveHandlerRef={saveHandlerRef} fileRegistry={fileRegistry} isAtBottom={isAtBottom} setIsAtBottom={setIsAtBottom} reader={augmentedReader} />
    );
  }, [activeTab, tabs, handleTabClick, handleLinkClick, isEditing, handleToggleEditMode, saveStatus, handleSidebarSave, fileName, content, handleSaveFile, saveHandlerRef, fileRegistry, isAtBottom, augmentedReader]);

  const resizer = useWindowResizer();

  const galleryHeaderSlot = (
    <div className="gallery-nav-bar">
      <GalleryDisk />
      <nav className="gallery-nav-links">
        <a href="/project">project</a>
        <a href="/about">about</a>
        <a href="/privacy">privacy</a>
      </nav>
    </div>
  );
  const visibleSecondary = useMemo(() => 
    ['chat', 'pdf', 'graph'].filter(id => openWindows.includes(id) && maximizedWindow !== id),
    [openWindows, maximizedWindow]
  );
  const hasEditor = openWindows.includes('editor') && maximizedWindow !== 'editor';

  return (
    <AudioVisualProvider>
    <div className={['accordion-app', !isMobile ? 'pc-layout' : '', activeTab || activeOverlay ? 'has-active' : '', activeOverlay === 'chat' ? 'chat-active' : '', activeOverlay === 'pdf' ? 'pdf-active' : '', activeOverlay === 'graph' ? 'graph-active' : ''].join(' ')} ref={appShellRef}>
      <div className="case-background"><img src="/casebg2.png" alt="" /></div>
      <div className="video-overlay" />
      <SpritzOverlay text={reader.currentText} isPlaying={reader.isPlaying} isPaused={reader.isPaused} playbackRate={reader.playbackRate} />
      <MusicPlayer isPlaying={reader.isPlaying} isPaused={reader.isPaused} playbackRate={reader.playbackRate} />

      {!isMobile ? (
        <>
          <StickySpine showHeader={showHeader} activeTab={activeTab} activeOverlay={activeOverlay} handleCreateNewNote={handleCreateNewNote} setActiveOverlay={(id) => {
            if (typeof id === 'function') {
              const result = id(activeOverlay);
              if (!result) return;
              if (result === 'editor') {
                if (openWindows.includes('editor')) {
                  window.history.back();
                } else {
                  const rawDefault = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || '';
                  const cleanDefault = rawDefault.replace(/\.md$/, '').toLowerCase();
                  const defaultFile = allFiles.find(f => f.name.replace('.md', '').toLowerCase() === cleanDefault);
                  if (defaultFile) loadFile(defaultFile.path, defaultFile.name, defaultFile.id, 'push', true);
                  else toggleWindow('editor');
                }
              } else {
                toggleWindow(result);
              }
            } else {
              if (id) toggleWindow(id);
            }
          }} setActiveTab={setActiveTab} openWindows={openWindows} />
          
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: openWindows.length > 0 ? 0.15 : 1, pointerEvents: openWindows.length > 0 ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}>
            <NoteGallery
              graphFiles={graphFiles}
              onSelectFile={(path, name, id) => {
                const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md'];
                if (githubUrl) loadFile(githubUrl, name, id, 'push', true);
              }}
              headerSlot={galleryHeaderSlot}
            />
          </div>

          <div className={`windows-container ${maximizedWindow ? 'has-maximized' : ''} ${openWindows.includes('editor') ? 'has-editor' : ''} ${openWindows.length > (openWindows.includes('editor') ? 1 : 0) ? 'has-others' : ''} ${resizer.isDragging ? 'dragging' : ''} ${openWindows.length === 0 ? 'no-windows' : ''}`}>
            
            {/* EDITOR WINDOW */}
            {everOpened.filter(winId => winId === 'editor').map((winId) => {
              const isMax = maximizedWindow === winId;
              const isOpen = openWindows.includes(winId);
              const isHidden = !isOpen || (maximizedWindow && !isMax);
              if (isHidden && !isMax) return null;
              
              const tabTitle = tabs.find(t => t.id === activeTab)?.title || 'Note';
              
              return (
                <div key={winId} className="window-frame-wrapper" style={isMax ? {} : { flex: hasEditor && visibleSecondary.length > 0 ? resizer.editorWidth : 1 }}>
                  <WindowFrame
                    id={winId}
                    title={`Case Archives - ${tabTitle}`}
                    isMaximized={isMax}
                    isHidden={false}
                    onToggleMaximize={toggleMaximize}
                    onClose={closeWindow}
                    onSave={handleSidebarSave}
                    saveStatus={saveStatus}
                    onToggleEdit={handleToggleEditMode}
                    isEditing={isEditing}
                    onComment={handleAppendComment}
                    onNewNote={handleCreateNewNote}
                    isMobile={false}
                    isPinned={pinnedWindows.includes(winId)}
                    onTogglePin={togglePin}
                    allFiles={allFiles}
                    onSelectFile={(f) => {
                      const githubUrl = fileRegistry.current[f.id.toLowerCase()] || fileRegistry.current[f.id.toLowerCase() + '.md'];
                      if (githubUrl) {
                        loadFile(githubUrl, f.name, f.id, 'push', true);
                      }
                    }}
                  >
                    {activeTabPanel}
                  </WindowFrame>
                </div>
              );
            })}

            {/* MAIN VERTICAL RESIZER */}
            {hasEditor && visibleSecondary.length > 0 && (
              <div 
                className={`resizer-v ${resizer.isDragging === 'main' ? 'active' : ''}`}
                onMouseDown={(e) => resizer.onMouseDown(e, 'main')}
              >
                {/* JUNCTION POINTS */}
                {visibleSecondary.length > 1 && visibleSecondary.map((winId, idx) => {
                  if (idx === visibleSecondary.length - 1) return null;
                  const nextId = visibleSecondary[idx + 1];
                  
                  // Approximate junction position based on weights
                  const totalWeight = visibleSecondary.reduce((acc, id) => acc + resizer.secondaryWeights[id], 0);
                  const weightsBefore = visibleSecondary.slice(0, idx + 1).reduce((acc, id) => acc + resizer.secondaryWeights[id], 0);
                  const topPercent = (weightsBefore / totalWeight) * 100;
                  
                  return (
                    <div 
                      key={`junction-${winId}-${nextId}`}
                      className={`resizer-junction ${resizer.isDragging === `junction-${winId}-${nextId}` ? 'active' : ''}`}
                      style={{ top: `${topPercent}%`, left: '50%' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        resizer.onMouseDown(e, `junction-${winId}-${nextId}`);
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* SECONDARY WINDOWS COLUMN */}
            {visibleSecondary.length > 0 && !maximizedWindow && (
              <div className="secondary-windows" style={{ flex: hasEditor ? (100 - resizer.editorWidth) : 1 }}>
                {visibleSecondary.map((winId, idx) => {
                  let title = ''; let winContent = null;
                  
                  if (winId === 'chat') {
                    title = 'AI Chat Vault';
                    winContent = <div className="chat-container"><Chat ref={chatRef} isEmbedded={true} onLinkClick={handleLinkClick} onLiveCallChange={setIsLiveCallActive} /></div>;
                  } else if (winId === 'pdf') {
                    title = 'PDF Reader';
                    winContent = <div className="pdf-container"><PDFViewer ref={pdfRef} onClose={() => closeWindow('pdf')} reader={augmentedReader} isOpen={true} onStateChange={handlePdfStateChange} initialFile={lastPdfStateRef.current.file} initialPage={lastPdfStateRef.current.pageNumber} initialFitMode={lastPdfStateRef.current.fitMode} /></div>;
                  }
                  else if (winId === 'graph') {
                    const activeFile = graphFiles.find(f => f.id === activeTab);
                    let displayTag = 'Graph View';
                    if (activeFile && activeFile.fetchedContent) {
                      const tagMatch = activeFile.fetchedContent.match(/tag:\s*#?([^\n\r,]+)/i);
                      if (tagMatch && tagMatch[1]) {
                        displayTag = `#${tagMatch[1].trim()}`;
                      }
                    }
                    title = displayTag;
                    winContent = <GraphView 
                      allFiles={graphFiles} 
                      onSelectFile={(path, name, id) => { 
                        const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md']; 
                        if (githubUrl) loadFile(githubUrl, name, id, 'push', true); 
                      }} 
                      activeNodeId={activeTab} 
                      fullContentCache={fullContentCache} 
                      zoomToNodeId={zoomToNodeId}
                      onZoomComplete={() => setZoomToNodeId(null)}
                    />;
                  }
                  
                  return (
                    <React.Fragment key={winId}>
                      <div className="window-frame-wrapper" style={{ flex: resizer.secondaryWeights[winId] }}>
                        <GraphWindowWrapper
                          winId={winId}
                          title={title}
                          isMaximized={false}
                          isHidden={false}
                          toggleMaximize={toggleMaximize}
                          closeWindow={closeWindow}
                          winContent={winContent}
                          isLiveCallActive={isLiveCallActive}
                          chatRef={chatRef}
                          pdfState={pdfState}
                          pdfRef={pdfRef}
                          allFiles={allFiles}
                          fileRegistry={fileRegistry}
                          loadFile={loadFile}
                          graphFiles={graphFiles}
                          fullContentCache={fullContentCache}
                          setZoomToNodeId={setZoomToNodeId}
                          isPinned={pinnedWindows.includes(winId)}
                          onTogglePin={togglePin}
                        />
                      </div>
                      
                      {/* HORIZONTAL RESIZER */}
                      {idx < visibleSecondary.length - 1 && (
                        <div 
                          className={`resizer-h ${resizer.isDragging === `${winId}-${visibleSecondary[idx+1]}` ? 'active' : ''}`}
                          onMouseDown={(e) => resizer.onMouseDown(e, `${winId}-${visibleSecondary[idx+1]}`)}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Handle Maximized Secondary Window */}
            {maximizedWindow && maximizedWindow !== 'editor' && (
              <div className="secondary-windows has-maximized">
                 {(() => {
                    const winId = maximizedWindow;
                    let title = ''; let winContent = null;
                    if (winId === 'chat') {
                      title = 'AI Chat Vault';
                      winContent = <div className="chat-container"><Chat ref={chatRef} isEmbedded={true} onLinkClick={handleLinkClick} onLiveCallChange={setIsLiveCallActive} /></div>;
                    } else if (winId === 'pdf') {
                      title = 'PDF Reader';
                      winContent = <div className="pdf-container"><PDFViewer ref={pdfRef} onClose={() => closeWindow('pdf')} reader={augmentedReader} isOpen={true} onStateChange={handlePdfStateChange} initialFile={lastPdfStateRef.current.file} initialPage={lastPdfStateRef.current.pageNumber} initialFitMode={lastPdfStateRef.current.fitMode} /></div>;
                    } else if (winId === 'graph') {
                      const activeFile = graphFiles.find(f => f.id === activeTab);
                      let displayTag = 'Graph View';
                      if (activeFile && activeFile.fetchedContent) {
                        const tagMatch = activeFile.fetchedContent.match(/tag:\s*#?([^\n\r,]+)/i);
                        if (tagMatch && tagMatch[1]) displayTag = `#${tagMatch[1].trim()}`;
                      }
                      title = displayTag;
                      winContent = <GraphView allFiles={graphFiles} onSelectFile={(path, name, id) => { const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md']; if (githubUrl) loadFile(githubUrl, name, id, 'push', true); }} activeNodeId={activeTab} fullContentCache={fullContentCache} zoomToNodeId={zoomToNodeId} onZoomComplete={() => setZoomToNodeId(null)} />;
                    }

                    return (
                      <GraphWindowWrapper
                        winId={winId}
                        title={title}
                        isMaximized={true}
                        isHidden={false}
                        toggleMaximize={toggleMaximize}
                        closeWindow={closeWindow}
                        winContent={winContent}
                        isLiveCallActive={isLiveCallActive}
                        chatRef={chatRef}
                        pdfState={pdfState}
                        pdfRef={pdfRef}
                        allFiles={allFiles}
                        fileRegistry={fileRegistry}
                        loadFile={loadFile}
                        graphFiles={graphFiles}
                        fullContentCache={fullContentCache}
                        setZoomToNodeId={setZoomToNodeId}
                        isPinned={pinnedWindows.includes(winId)}
                        onTogglePin={togglePin}
                      />
                    );
                 })()}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <FunctionBall isFooterExpanded={isFooterExpanded} setIsFooterExpanded={setIsFooterExpanded} showReadMore={showReadMore} showFunctionBall={showFunctionBall} isAtBottom={isAtBottom} activeOverlay={activeOverlay} setActiveOverlay={setActiveOverlay} handleCreateNewNote={handleCreateNewNote} fileName={fileName} handleAppendComment={handleAppendComment} handleTabClick={handleTabClick} nextTabForActive={nextTabForActive} prevTabForActive={prevTabForActive} isEditing={isEditing} handleToggleEditMode={handleToggleEditMode} saveStatus={saveStatus} handleSidebarSave={handleSidebarSave} activeTabType={tabs.find(t => t.id === activeTab)?.type} activeTabObj={tabs.find(t => t.id === activeTab)} />
          {!activeTab && !activeOverlay && (
            <NoteGallery
              graphFiles={graphFiles}
              onSelectFile={(path, name, id) => {
                const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md'];
                if (githubUrl) loadFile(githubUrl, name, id, 'push', true);
              }}
              headerSlot={galleryHeaderSlot}
            />
          )}
          <GraphOverlay isOpen={activeOverlay === 'graph'} graphFiles={graphFiles} activeTab={activeTab} loadFile={loadFile} fileRegistry={fileRegistry} fullContentCache={fullContentCache} />
          <ChatOverlay isOpen={activeOverlay === 'chat'} handleLinkClick={handleLinkClick} reader={augmentedReader} />
          <PDFOverlay isOpen={activeOverlay === 'pdf'} setActiveOverlay={setActiveOverlay} reader={augmentedReader} onStateChange={handlePdfStateChange} initialFile={lastPdfStateRef.current.file} initialPage={lastPdfStateRef.current.pageNumber} initialFitMode={lastPdfStateRef.current.fitMode} />
          {tabs.filter(t => t.type === 'editor' || t.type === 'static').map(tab => ( <TabPanel key={tab.id} tab={tab} activeTab={activeTab} handleTabClick={handleTabClick} handleLinkClick={handleLinkClick} isEditing={isEditing} handleToggleEditMode={handleToggleEditMode} saveStatus={saveStatus} handleSidebarSave={handleSidebarSave} fileName={fileName} content={content} handleSaveFile={handleSaveFile} saveHandlerRef={saveHandlerRef} fileRegistry={fileRegistry} isAtBottom={isAtBottom} setIsAtBottom={setIsAtBottom} reader={augmentedReader} /> ))}
        </>
      )}

      {(pendingReadConfirm || reader.isPlaying) && (
        <div className="global-reader-bar" onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', borderRadius: '40px', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px', border: '1px solid var(--colorbutton, #FFFACD)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,250,205,0.2)', animation: 'fadeInDown 0.3s ease-out', color: 'white', transition: 'all 0.3s ease' }}>
          {pendingReadConfirm ? ( <div className="reader-confirm-btn" onClick={() => { pendingReadConfirm(); setPendingReadConfirm(null); }} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}><Volume2 size={20} color="var(--colorbutton, #FFFACD)" /></div> ) : (
            <>
              <div className="reader-ctrl-btn" onClick={() => reader.isPaused ? reader.resume() : reader.pause()} title={reader.isPaused ? "Resume" : "Pause"} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{reader.isPaused ? ( <Play size={20} fill="var(--colorbutton, #FFFACD)" color="var(--colorbutton, #FFFACD)" /> ) : ( <Pause size={20} fill="var(--colorbutton, #FFFACD)" color="var(--colorbutton, #FFFACD)" /> )}</div>
              <div className="reader-ctrl-btn" onClick={() => reader.stop()} title="Stop" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Square size={18} fill="white" color="white" /></div>
              <div className="reader-speed-toggle" onClick={() => { const rates = [1.0, 1.25, 1.5, 2.0]; let next; if (reader.playbackRate === 4.0) next = 1.0; else if (reader.playbackRate === 2.0) next = reader.isPaused ? 4.0 : 1.0; else { const idx = rates.indexOf(reader.playbackRate); next = idx === -1 ? 1.0 : rates[(idx + 1) % rates.length]; } reader.setSpeed(next); }} style={{ cursor: 'pointer', fontSize: '13px', fontWeight: '800', color: reader.playbackRate === 4.0 ? '#FF4500' : 'var(--colorbutton, #FFFACD)', background: reader.playbackRate === 4.0 ? 'rgba(255,69,0,0.2)' : 'rgba(255,250,205,0.1)', padding: '4px 10px', borderRadius: '12px', minWidth: '45px', textAlign: 'center', userSelect: 'none', transition: 'all 0.3s ease' }}>{reader.playbackRate}x</div>
              <div className="reader-cefr-toggle" onClick={() => { const levels = ['none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2']; const idx = levels.indexOf(reader.cefrLevel); const next = levels[(idx + 1) % levels.length]; reader.updateCefrLevel(next); }} title="Learning English Level" style={{ cursor: 'pointer', fontSize: '11px', fontWeight: '900', color: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.4)' : '#000', background: reader.cefrLevel === 'none' ? 'rgba(255,250,205,0.05)' : 'var(--colorbutton, #FFFACD)', padding: '4px 8px', borderRadius: '10px', minWidth: '40px', textAlign: 'center', userSelect: 'none', textTransform: 'uppercase', border: reader.cefrLevel === 'none' ? '1px solid rgba(255,250,205,0.1)' : 'none' }}>{reader.cefrLevel === 'none' ? 'Off' : reader.cefrLevel}</div>
            </>
          )}
          <style dangerouslySetInnerHTML={{ __html: ` .reader-ctrl-btn { opacity: 0.8; transition: all 0.2s; } .reader-ctrl-btn:hover { opacity: 1; transform: scale(1.1); } .reader-speed-toggle:hover { background: rgba(255,250,205,0.2); } .reader-cefr-toggle { transition: all 0.2s; } .reader-cefr-toggle:hover { transform: scale(1.05); filter: brightness(1.1); } @keyframes fadeInDown { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } } `}} />
        </div>
      )}
      <PromptOverlays passPrompt={passPrompt} setPassPrompt={setPassPrompt} namePrompt={namePrompt} setNamePrompt={setNamePrompt} commentPrompt={commentPrompt} setCommentPrompt={setCommentPrompt} />
      <VaultStyles />
    </div>
    </AudioVisualProvider>
  );
}
