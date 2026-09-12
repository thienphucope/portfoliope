"use client";
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { DEFAULT_VAULT_FILE, CASE_BASE } from '@/configs/vault';
import { ArrowLeft } from 'lucide-react';
import BlockEditor from '@/features/caseArchive/components/BlockEditor';
import WindowFrame from '@/components/ui/WindowFrame';
import Link from 'next/link';
import theme from './styles/ArchiveTheme.module.css';
import styles from './styles/CaseReader.module.css';
import dynamic from 'next/dynamic';

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useFileRegistry }     from '@/features/caseArchive/hooks/useFileRegistry';
import { useFileLoader }       from '@/features/caseArchive/hooks/useFileLoader';
import { useScrollBehavior }   from '@/features/caseArchive/hooks/useScrollBehavior';
import { useContentCache }     from '@/features/caseArchive/hooks/useContentCache';
import { useLinkHandler }      from '@/features/caseArchive/hooks/useLinkHandler';

import { useReader } from '@/features/caseArchive/hooks/useReader';
import { Volume2, VolumeX, Play, Pause, Square, Zap } from 'lucide-react';
import { useGraphData } from '@/features/caseArchive/hooks/useGraphData';
import SpritzOverlay from '@/features/caseArchive/components/SpritzOverlay';
import ChapterRail from '@/features/caseArchive/components/ChapterRail';

const GraphView = dynamic(() => import('@/features/caseArchive/components/GraphView'), { ssr: false });


// Layout effect on the client, no-op on the server (avoids SSR warning).
const useIsoLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const PDFViewer = dynamic(() => import('@/features/caseArchive/components/PDFViewer'), { ssr: false });
const ChatRoom = dynamic(() => import('@/features/chatroom/ChatRoom'), { ssr: false });

export default function CaseReader({ serverHydratedData = null }) {
  const [fileName,     setFileName]     = useState('');
  const [isEditorOpen,       setIsEditorOpen]       = useState(false);
  const [editorView,         setEditorView]          = useState('note');
  const reader = useReader({ resetKey: `${isEditorOpen ? 'open' : 'closed'}:${editorView}:${fileName}` });
  const [pendingReadConfirm, setPendingReadConfirm] = useState(null);
  const triggerRead = useCallback((e, onConfirm) => {
    if (reader.isPlaying) return;
    setPendingReadConfirm(() => onConfirm);
    setTimeout(() => { setPendingReadConfirm(prev => (prev === onConfirm ? null : prev)); }, 5000);
  }, [reader.isPlaying]);

  const augmentedReader = useMemo(() => ({ ...reader, triggerRead }), [reader, triggerRead]);

  useEffect(() => {
    setPendingReadConfirm(null);
  }, [fileName, editorView, isEditorOpen]);

  const [content,      setContent]      = useState('');
  const [contentKey,   setContentKey]   = useState(0);
  const [activeOverlay,      setActiveOverlay]      = useState(null); 
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
    window.history.replaceState({}, '', CASE_BASE);
  }, []);

  const toggleMaximize = useCallback(() => { setMaximizedWindow(prev => prev ? null : 'editor'); }, []);

  const [isAtBottom,         setIsAtBottom]          = useState(false);
  const [searchTerm,         setSearchTerm]          = useState('');
  const [showSearch,         setShowSearch]          = useState(false);
  const [viewMode,           setViewMode]            = useState('graph'); 
const [zoomToNodeId,       setZoomToNodeId]        = useState(null);
  const [activeChapterIndex, setActiveChapterIndex]  = useState(0);

  const appShellRef  = useRef(null);
  const scrollPosMap = useRef({});
  const markdownContainerRef = useRef(null);

  const applyFileContent = useCallback((repoKey, newContent) => {
    React.startTransition(() => { setFileName(repoKey); setContent(newContent); setContentKey((k) => k + 1); setIsAtBottom(false); });
  }, []);

  const { fileTree, setFileTree, fileRegistry, serverRawCache, buildRegistry } = useFileRegistry();

  const getAllFiles = useCallback((nodes, repoPath = '') => {
    let files = [];
    nodes.forEach((n) => {
      if (n.kind === 'file') files.push({ id: repoPath ? `${repoPath}/${n.name}` : n.name, name: n.name, path: n.path });
      else if (n.children) files = files.concat(getAllFiles(n.children, repoPath ? `${repoPath}/${n.name}` : n.name));
    });
    return files;
  }, []);

  const allFiles = useMemo(() => getAllFiles(fileTree), [fileTree, getAllFiles]);

  const { fullContentCache, initializeFromServer, upsertCacheEntry } = useContentCache({ serverRawCache });
  const { activeTab, setActiveTab, loadFile: _loadFile } = useFileLoader({ serverRawCache, upsertCacheEntry, applyFileContent, setActiveOverlay });

  const loadFile = useCallback((...args) => { setIsEditorOpen(true); return _loadFile(...args); }, [_loadFile]);

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
      const isRoot = window.location.pathname === CASE_BASE || window.location.pathname === `${CASE_BASE}/`;
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

  const isRestoringRef = useRef(false);
  const updateActiveChapter = useCallback((container) => {
    if (!container) return;
    const heads = Array.from(container.querySelectorAll('.block-view h1, .block-view h2, .block-view h3, .block-view h4, .block-view h5, .block-view h6'));
    if (!heads.length) {
      setActiveChapterIndex(0);
      return;
    }
    const containerTop = container.getBoundingClientRect().top;
    let nextIndex = 0;
    for (let i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top - containerTop <= 80) nextIndex = i;
      else break;
    }
    setActiveChapterIndex(prev => prev === nextIndex ? prev : nextIndex);
  }, []);

  useIsoLayoutEffect(() => {
    setActiveChapterIndex(0);
  }, [contentKey, activeTab]);

  // Restore each note's own scroll position (default: top). Blocks/images render
  // asynchronously, so re-apply for a few frames until layout settles — and stop
  // early if the user scrolls, so we never fight their input.
  useIsoLayoutEffect(() => {
    const el = markdownContainerRef.current;
    if (!el || !fileName) return;
    const target = scrollPosMap.current[fileName] ?? 0;
    resetScroll(el); // stop any in-flight custom wheel-scroll and clear its cached target for this reused element
    isRestoringRef.current = true;
    el.scrollTop = target;
    updateActiveChapter(el);
    let raf;
    let frames = 0;
    const reapply = () => {
      if (!isRestoringRef.current) return;
      el.scrollTop = target;
      updateActiveChapter(el);
      if (++frames < 8) raf = requestAnimationFrame(reapply);
      else isRestoringRef.current = false;
    };
    raf = requestAnimationFrame(reapply);
    const stop = () => {
      isRestoringRef.current = false;
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchmove', stop);
    };
    el.addEventListener('wheel', stop, { passive: true });
    el.addEventListener('touchmove', stop, { passive: true });
    const timer = setTimeout(stop, 320);
    return () => { clearTimeout(timer); stop(); };
  }, [fileName, resetScroll, updateActiveChapter]);

  useEffect(() => {
    if ((window.location.pathname === CASE_BASE || window.location.pathname === `${CASE_BASE}/`) && !window.history.state) window.history.replaceState({ isRoot: true }, '', CASE_BASE);
    const initialize = (data) => {
      const repoPathMap = buildRegistry(data.tree); setFileTree(data.tree); initializeFromServer(data.contentCache || {}, data.rawCache || {});
      // Path is /casearchive[/<slug>]; drop the base prefix to recover the case slug parts.
      const relPath = window.location.pathname.startsWith(CASE_BASE) ? window.location.pathname.slice(CASE_BASE.length) : window.location.pathname;
      const pathParts = relPath.split('/').filter(Boolean);
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

  const { handleLinkClick } = useLinkHandler({ loadFile, tabs, fileRegistry, setActiveOverlay });
  const contentCacheRef = useRef(fullContentCache);
  contentCacheRef.current = fullContentCache; // sync during render, no effect needed
  const graphFiles = useMemo(() => allFiles.map((f) => ({ ...f, fetchedContent: contentCacheRef.current[f.id]?.raw || '' })), [allFiles]);
  const { nodes: graphNodes } = useGraphData({ allFiles: graphFiles, fullContentCache });

  // Headings of the current note → left-rail chapters (in document order).
  const chapters = useMemo(() => {
    if (!content) return [];
    const out = [];
    let inFence = false;
    for (const line of content.split('\n')) {
      if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
      if (inFence) continue;
      const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (m) {
        const text = m[2].replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/[*_`~]/g, '').trim();
        if (text) out.push({ level: m[1].length, text });
      }
    }
    return out;
  }, [content]);

  const scrollToChapter = useCallback((index) => {
    const el = markdownContainerRef.current;
    if (!el) return;
    isRestoringRef.current = false; // let the user's jump win over any in-flight restore
    resetScroll(el);
    setActiveChapterIndex(index);

    let attempts = 0;
    const jump = () => {
      const heads = Array.from(el.querySelectorAll('.block-view h1, .block-view h2, .block-view h3, .block-view h4, .block-view h5, .block-view h6'));
      const target = heads[index];
      if (!target) {
        if (attempts < 2) {
          attempts += 1;
          requestAnimationFrame(jump);
        }
        return;
      }
      const containerTop = el.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top - containerTop + el.scrollTop - 16;
      el.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    };

    jump();
  }, [resetScroll]);

  const activeTabPanel = useMemo(() => {
    const activeT = tabs.find(t => t.id === activeTab); if (!activeT) return null;
    return (
      <article ref={markdownContainerRef} className="markdown-container" onScroll={(e) => { const t = e.target; if (fileName && !isRestoringRef.current) scrollPosMap.current[fileName] = t.scrollTop; updateActiveChapter(t); const bottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 100; if (bottom !== isAtBottom) setIsAtBottom(bottom); }}>
        <div className="note-content-wrapper">
          {fileName === activeT.id ? (
            <BlockEditor content={content} fileName={fileName} onLinkClick={handleLinkClick} fileRegistry={fileRegistry.current} reader={augmentedReader} />
          ) : (
            <div className={styles.loading} role="status">Loading...</div>
          )}
        </div>
      </article>
    );
  }, [activeTab, tabs, fileName, content, fileRegistry, isAtBottom, augmentedReader, handleLinkClick, updateActiveChapter]);

  return (
    <main className={[theme.theme, styles.reader, 'accordion-app pc-layout', activeTab ? 'has-active' : '', !isEditorOpen ? 'feed-active' : ''].join(' ')} ref={appShellRef}>
      <header className={styles.masthead}>
        <Link className={styles.brand} href="/">Ope Watson</Link>
        <Link className={styles.backLink} href="/"><ArrowLeft size={16} aria-hidden="true" />Case archives</Link>
      </header>
      <SpritzOverlay text={reader.currentText} isPlaying={reader.isPlaying} isPaused={reader.isPaused} playbackRate={reader.playbackRate} />

      <>
          {isEditorOpen && !maximizedWindow && (
            <div onClick={closeEditorWindow} className={styles.dismissArea} />
          )}

          {isEditorOpen && (
            <div className={`windows-container has-editor ${styles.windows} ${maximizedWindow ? 'has-maximized' : ''}`}>

              {editorView === 'note' && !isChatOpen && tabs.find(t => t.id === activeTab)?.type === 'editor' && (
                <ChapterRail chapters={chapters} activeIndex={activeChapterIndex} onJump={scrollToChapter} />
              )}

              {(() => {
                const isMax = !!maximizedWindow;
                const tabTitle = tabs.find(t => t.id === activeTab)?.title || 'Note';
                const mainContent = editorView === 'graph'
                  ? <GraphView allFiles={graphFiles} onSelectFile={(path, name, id) => { const githubUrl = fileRegistry.current[id.toLowerCase()] || fileRegistry.current[id.toLowerCase() + '.md']; if (githubUrl) loadFile(githubUrl, name, id, 'push', true); }} activeNodeId={activeTab} zoomToNodeId={zoomToNodeId} onZoomComplete={() => setZoomToNodeId(null)} />
                  : editorView === 'pdf'
                    ? <div className="pdf-container"><PDFViewer ref={pdfRef} onClose={() => setEditorView('note')} reader={augmentedReader} isOpen={true} onStateChange={handlePdfStateChange} initialFile={lastPdfStateRef.current.file} initialPage={lastPdfStateRef.current.pageNumber} initialFitMode={lastPdfStateRef.current.fitMode} /></div>
                    : activeTabPanel;
                const editorContent = (
                  <div className={styles.editorContent}>
                    <div className={styles.mainPane}>{mainContent}</div>
                    {isChatOpen && (
                      <div className={styles.chatPane}>
                        <div className="chat-container">
                          <ChatRoom ref={chatRef} isEmbedded={true} onLinkClick={handleLinkClick} onLiveCallChange={setIsLiveCallActive} />
                        </div>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className={`window-frame-wrapper ${isMax ? '' : styles.windowWrapper}`}>
                    <WindowFrame
                      id="editor"
                      title={`Case Archives - ${tabTitle}`}
                      isMaximized={isMax}
                      isHidden={false}
                      onToggleMaximize={toggleMaximize}
                      onClose={closeEditorWindow}
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
          {!isEditorOpen && <div className={styles.loading} role="status">Consulting archives...</div>}
        </>

      {(pendingReadConfirm || reader.isPlaying) && (
        <div className={styles.readerBar} onClick={(e) => e.stopPropagation()} role="group" aria-label="Reading controls">
          {pendingReadConfirm ? ( <button type="button" className={styles.readerButton} aria-label="Start reading" onClick={() => { pendingReadConfirm(); setPendingReadConfirm(null); }}><Volume2 size={20} /></button> ) : (
            <>
              <button type="button" className={styles.readerButton} onClick={() => reader.isPaused ? reader.resume() : reader.pause()} title={reader.isPaused ? "Resume" : "Pause"} aria-label={reader.isPaused ? "Resume" : "Pause"}>{reader.isPaused ? ( <Play size={20} fill="currentColor" /> ) : ( <Pause size={20} fill="currentColor" /> )}</button>
              <button type="button" className={styles.readerButton} onClick={() => reader.stop()} title="Stop" aria-label="Stop"><Square size={18} fill="currentColor" /></button>
              <button type="button" className={`${styles.readerButton} ${reader.playbackRate === 4.0 ? styles.fastReading : ''}`} aria-label={`Reading speed: ${reader.playbackRate}x`} onClick={() => { const rates = [1.0, 1.25, 1.5, 2.0]; let next; if (reader.playbackRate === 4.0) next = 1.0; else if (reader.playbackRate === 2.0) next = reader.isPaused ? 4.0 : 1.0; else { const idx = rates.indexOf(reader.playbackRate); next = idx === -1 ? 1.0 : rates[(idx + 1) % rates.length]; } reader.setSpeed(next); }}>{reader.playbackRate}x</button>
              <button type="button" className={`${styles.readerButton} ${reader.cefrLevel !== 'none' ? styles.activeLevel : ''}`} onClick={() => { const levels = ['none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2']; const idx = levels.indexOf(reader.cefrLevel); const next = levels[(idx + 1) % levels.length]; reader.updateCefrLevel(next); }} title="Learning English Level" aria-label={`Learning English Level: ${reader.cefrLevel}`}>{reader.cefrLevel === 'none' ? 'Off' : reader.cefrLevel}</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
