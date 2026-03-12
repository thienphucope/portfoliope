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
  const bgPlayerRef    = useRef(null);
  
  // Custom Smooth Scrolling States
  const isTabScrolling = useRef(false);
  const tabAnimId = useRef(null);
  const targetScrollX  = useRef(null);
  const isWheelScrollingX = useRef(false);

  const verticalScrollTargets = useRef(new Map());
  const isWheelScrollingY = useRef(new Map());

  // Handle global click to toggle video interactability
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const container = e.target.closest('.video-container');
      if (container) {
        container.classList.add('interactable');
      } else {
        document.querySelectorAll('.video-container.interactable').forEach(c => c.classList.remove('interactable'));
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  useEffect(() => {
    const initBgPlayer = () => {
      if (window.YT && window.YT.Player && !bgPlayerRef.current) {
        bgPlayerRef.current = new window.YT.Player('bg-player-case', {
          videoId: '305Uc8i5RJM',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            start: 48,
            end: 120,
          },
          events: {
            onReady: (e) => {
              e.target.mute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                e.target.seekTo(37);
                e.target.playVideo();
              }
            },
          },
        });
      }
    };

    if (!window.YT || !window.YT.Player) {
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const tag = document.createElement('script'); 
        tag.src = "https://www.youtube.com/iframe_api";
        const first = document.getElementsByTagName('script')[0];
        if (first) {
          first.parentNode.insertBefore(tag, first);
        } else {
          document.head.appendChild(tag);
        }
      }
      
      const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT);
          initBgPlayer();
        }
      }, 100);
    } else {
      initBgPlayer();
    }
  }, []);

  // Accordion state
  const [openFiles, setOpenFiles] = useState([]); // Array of { id, path, name, serverPath, fetchedContent }
  const [activeTab, setActiveTab] = useState('filetree'); 

  const loadFile = useCallback(async (path, name, serverPath = null, historyMode = 'push') => {
    let repoKey;
    let newContent = '';

    if (!path) {
      repoKey = serverPath || name;
      const cached = readCache(repoKey);
      newContent = Array.isArray(cached) && cached.length > 0
        ? cached.map(b => b.raw).join('\n\n')
        : `# ${name.replace('.md', '')}\n`;
      setContent(newContent);
      setFileName(repoKey);
      setContentKey(k => k + 1);
    } else {
      try {
        const res  = await fetch(path);
        newContent = await res.text();
        const urlParts = new URL(path, window.location.origin).pathname.split('/').slice(1);
        repoKey = serverPath || decodeURIComponent(urlParts.slice(3).join('/'));
        serverRawCache.current[repoKey] = newContent;
        setContent(newContent);
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
      } catch { 
        setContent('# Error\nFailed to load.');
        repoKey = serverPath || name;
      }
    }

    if (repoKey && repoKey !== 'error') {
      setOpenFiles(prev => {
        if (!prev.find(f => f.id === repoKey)) {
          return [...prev, { id: repoKey, path, name, serverPath, fetchedContent: newContent }];
        }
        return prev.map(f => f.id === repoKey ? { ...f, fetchedContent: newContent } : f);
      });
      setActiveTab(repoKey);
    }
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
    const initContent = `# ${title}\n`;
    setContent(initContent);
    setFileName(serverPath);
    setContentKey(k => k + 1);

    setOpenFiles(prev => {
      if (!prev.find(f => f.id === serverPath)) {
        return [...prev, { id: serverPath, path: null, name: displayName, serverPath, fetchedContent: initContent }];
      }
      return prev;
    });
    setActiveTab(serverPath);

  }, []);

  const handleLinkClick = useCallback((e) => {
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
      setActiveTab(serverPath);
      const openF = openFiles.find(f => f.id === serverPath);
      if (openF) {
        const cached = readCache(serverPath);
        const raw = Array.isArray(cached) && cached.length > 0
          ? cached.map(b => b.raw).join('\n\n')
          : openF.fetchedContent;
        setContent(raw);
        setContentKey(k => k + 1);
      }
    } else {
      createAndOpenFile(target);
    }
  }, [loadFile, createAndOpenFile, openFiles]);

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

  const getAllFiles = useCallback((nodes, repoPath = '') => {
    let files = [];
    nodes.forEach(n => {
      if (n.kind === 'file') {
        files.push({
          id: repoPath ? `${repoPath}/${n.name}` : n.name,
          name: n.name,
          path: n.path
        });
      } else if (n.children) {
        files = files.concat(getAllFiles(n.children, repoPath ? `${repoPath}/${n.name}` : n.name));
      }
    });
    return files;
  }, []);

  const allFiles = React.useMemo(() => getAllFiles(fileTree), [fileTree, getAllFiles]);

  const tabs = React.useMemo(() => {
    const baseTabs = [
      { id: 'filetree', title: 'File Tree', type: 'sidebar' },
      { id: 'chat', title: 'AI Chat Vault', type: 'chat' },
    ];
    
    const dashboard = allFiles.find(f => f.name.toLowerCase() === 'dash board.md');
    if (dashboard) {
      baseTabs.push({ id: dashboard.id, title: 'Dash Board', type: 'editor', fileData: dashboard });
    }

    allFiles.forEach(f => {
      if (f.name.toLowerCase() !== 'dash board.md') {
        baseTabs.push({ id: f.id, title: f.name.replace('.md', ''), type: 'editor', fileData: f });
      }
    });

    return baseTabs;
  }, [allFiles]);

  const handleTabClick = (tab, e) => {
    if (activeTab === tab.id) return;
    setActiveTab(tab.id);
    
    const tabIndex = tabs.findIndex(t => t.id === tab.id);
    if (tabIndex !== -1 && appShellRef.current) {
      isTabScrolling.current = true;
      targetScrollX.current = null;
      if (tabAnimId.current) cancelAnimationFrame(tabAnimId.current);

      const scrollTarget = (tabIndex - 1) * 150; 
      const maxScroll = Math.max(0, scrollTarget);
      
      let startStart = null;
      const startScroll = appShellRef.current.scrollLeft;
      const distance = maxScroll - startScroll;
      const duration = 1500;
      
      const step = (timestamp) => {
        if (!startStart) startStart = timestamp;
        const progress = Math.min((timestamp - startStart) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);
        
        if (appShellRef.current && isTabScrolling.current) {
           appShellRef.current.scrollLeft = startScroll + (distance * ease);
        }
        if (progress < 1 && isTabScrolling.current) {
          tabAnimId.current = window.requestAnimationFrame(step);
        } else {
          isTabScrolling.current = false;
          tabAnimId.current = null;
        }
      };
      tabAnimId.current = window.requestAnimationFrame(step);
    }
    
    if (tab.type === 'editor') {
      const cached = readCache(tab.id);
      const openedF = openFiles.find(f => f.id === tab.id);

      if (Array.isArray(cached) && cached.length > 0) {
        setFileName(tab.id);
        setContent(cached.map(b => b.raw).join('\n\n'));
        setContentKey(k => k + 1);
      } else if (openedF && openedF.fetchedContent) {
        setFileName(tab.id);
        setContent(openedF.fetchedContent);
        setContentKey(k => k + 1);
      } else if (tab.fileData && tab.fileData.path) {
        loadFile(tab.fileData.path, tab.fileData.name, tab.id, 'push');
      } else {
        // Fallback for missing path
        setFileName(tab.id);
        setContent(`# ${tab.title}\nLoading...`);
        setContentKey(k => k + 1);
      }
    }
  };

  // Implement mouse wheel horizontal scrolling
  useEffect(() => {
    const handleWheel = (e) => {
      if (!appShellRef.current || e.deltaY === 0 || e.shiftKey) return;

      if (isTabScrolling.current) {
        isTabScrolling.current = false;
        if (tabAnimId.current) cancelAnimationFrame(tabAnimId.current);
      }

      // Map vertical scroll to horizontal scroll for overflowing elements inside markdown
      const hScrollable = e.target.closest('.table-container, pre, .math-block');
      if (hScrollable) {
        const canScrollLeft = hScrollable.scrollLeft > 0;
        const canScrollRight = Math.ceil(hScrollable.scrollLeft + hScrollable.clientWidth) < hScrollable.scrollWidth;
        
        if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
          e.preventDefault();
          hScrollable.scrollLeft += e.deltaY;
          return;
        }
      }

      const vScrollable = e.target.closest('.markdown-container, .file-list, .chat-container');
      if (vScrollable) {
        const canScrollUp = vScrollable.scrollTop > 0;
        const canScrollDown = Math.ceil(vScrollable.scrollTop + vScrollable.clientHeight) < vScrollable.scrollHeight;

        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          e.preventDefault();
          
          if (!verticalScrollTargets.current.has(vScrollable)) {
            verticalScrollTargets.current.set(vScrollable, vScrollable.scrollTop);
          }
          
          let targetY = verticalScrollTargets.current.get(vScrollable) + e.deltaY * 1.5;
          targetY = Math.max(0, Math.min(targetY, vScrollable.scrollHeight - vScrollable.clientHeight));
          verticalScrollTargets.current.set(vScrollable, targetY);

          if (!isWheelScrollingY.current.get(vScrollable)) {
            isWheelScrollingY.current.set(vScrollable, true);
            const animateY = () => {
              const currentTarget = verticalScrollTargets.current.get(vScrollable);
              const diff = currentTarget - vScrollable.scrollTop;
              
              if (Math.abs(diff) < 0.5) {
                vScrollable.scrollTop = currentTarget;
                isWheelScrollingY.current.set(vScrollable, false);
                verticalScrollTargets.current.delete(vScrollable);
              } else {
                vScrollable.scrollTop += diff * 0.15;
                requestAnimationFrame(animateY);
              }
            };
            requestAnimationFrame(animateY);
          }
        }
        
        // Stop event from propagating to horizontal app scroll when hovering over vertical containers
        return;
      }

      // At boundary, scroll the app shell horizontally
      e.preventDefault();
      
      const shell = appShellRef.current;
      if (targetScrollX.current === null) {
        targetScrollX.current = shell.scrollLeft;
      }
      
      // Increase delta multiplier for larger scroll distance per wheel click
      targetScrollX.current += e.deltaY * 1.5;
      targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, shell.scrollWidth - shell.clientWidth));
      
      if (!isWheelScrollingX.current) {
        isWheelScrollingX.current = true;
        const animate = () => {
          if (!shell || targetScrollX.current === null) {
            isWheelScrollingX.current = false;
            return;
          }
          const diff = targetScrollX.current - shell.scrollLeft;
          if (Math.abs(diff) < 0.5) {
            shell.scrollLeft = targetScrollX.current;
            isWheelScrollingX.current = false;
            targetScrollX.current = null;
          } else {
            shell.scrollLeft += diff * 0.08;
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    };
    
    const shell = appShellRef.current;
    if (shell) {
      shell.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (shell) {
        shell.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  return (
    <div className="accordion-app" ref={appShellRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
        
        /* Force transparent backgrounds for all vault content */
        body, .app-shell, .main-content, .sidebar-panel, .chat-panel, 
        .chat-container, .markdown-container, .file-list, .prose {
          background: transparent !important;
        }

        .accordion-app {
          display: flex;
          flex-direction: row;
          width: 100vw;
          height: 100vh;
          overflow-x: auto;
          overflow-y: hidden;
          background: transparent;
        }

        .video-background { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; pointer-events: none; overflow: hidden; background: black; }
        .video-background iframe { 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          width: 100vw; 
          height: 100vh; 
          transform: translate(-50%, -50%) scale(1.5);
        }
        @media (max-aspect-ratio: 16/9) {
          .video-background iframe { width: 177.78vh; height: 100vh; }
        }
        @media (min-aspect-ratio: 16/9) {
          .video-background iframe { width: 100vw; height: 56.25vw; }
        }
        .video-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); pointer-events: none; }

        /* Hide scrollbar for accordion app container itself */
        .accordion-app::-webkit-scrollbar {
          display: none;
        }

        .sticky-spine {
          position: sticky;
          left: 0;
          z-index: 50;
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          flex-shrink: 0;
          background-color: var(--colorone);
          border-right: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          isolation: isolate;
        }

        .spine-content {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spine-homepage {
          position: absolute;
          bottom: 40px;
          writing-mode: vertical-rl;
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: black;
          opacity: 0.8;
          mix-blend-mode: destination-out;
          text-transform: uppercase;
          letter-spacing: 3px;
        }

        .acc-panel {
          display: flex;
          flex-direction: row;
          height: 100%;
          transition: flex-basis 1.5s cubic-bezier(0.25, 0.8, 0.25, 1), min-width 1.5s cubic-bezier(0.25, 0.8, 0.25, 1), flex-grow 1.5s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 1.5s;
          border-right: 2px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          flex-shrink: 0;
        }

        .acc-panel.closed {
          flex-basis: 150px;
          min-width: 150px;
          flex-grow: 0;
          background-color: var(--colorone);
          cursor: pointer;
          isolation: isolate;
        }

        .acc-panel.open {
          flex-basis: max(500px, calc(100vw - 600px));
          min-width: max(500px, calc(100vw - 600px));
          flex-grow: 1;
          background-color: transparent;
        }

        .acc-spine-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: var(--colorone);
          cursor: pointer;
          display: flex;
          align-items: top;
          padding-top: 3rem;
          justify-content: center;
          isolation: isolate;
        }

        .acc-spine {
          writing-mode: vertical-rl;
          font-family: 'Fredericka the Great', cursive;
          font-size: 3rem;
          color: black;
          mix-blend-mode: destination-out;
          white-space: nowrap;
          letter-spacing: 2px;
          user-select: none;
        }
        
        .acc-ope-container {
          flex: 0 0 150px;
          height: 100%;
          background-color: #b09278;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
        }
        .acc-ope {
          writing-mode: vertical-rl;
          font-family: 'Fredericka the Great', cursive;
          font-size: 2rem;
          color: black;
          mix-blend-mode: destination-out;
          white-space: nowrap;
          letter-spacing: 2px;
          user-select: none;
        }

        .acc-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: calc(100% - 150px);
          animation: fadeIn 1s ease forwards 0.5s;
          opacity: 0;
          position: relative;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .acc-body {
          flex: 1;
          overflow: hidden; 
          position: relative;
          display: flex;
          flex-direction: column;
        }

        /* Hide scrollbars inside panel bodies */
        .acc-body *::-webkit-scrollbar {
          display: none !important;
        }
        .acc-body * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }

        .floating-actions {
          position: absolute;
          top: 15px;
          right: 30px;
          display: flex;
          gap: 10px;
          z-index: 100;
        }
      `}</style>

      <div className="video-background">
        <div id="bg-player-case"></div>
      </div>
      <div className="video-overlay"></div>

      {/* Sticky Spine */}
      <div className="acc-panel sticky-spine" onClick={() => window.location.href = '/'}>
        <div className="acc-ope-container" style={{ width: '100%', flex: '1' }}>
          <div className="spine-content">
            <div className="acc-ope">Ope Watson</div>
            <div className="spine-homepage">homepage</div>
          </div>
        </div>
      </div>

      {tabs.map((tab, index) => {
        const isOpen = activeTab === tab.id;
        return (
          <div 
            key={tab.id} 
            className={`acc-panel ${isOpen ? 'open' : 'closed'}`}
          >
            {/* The spine is always shown, whether open or closed */}
            <div className="acc-spine-container" onClick={(e) => handleTabClick(tab, e)}>
              <div className="acc-spine">
                {tab.title}
              </div>
            </div>
            
            {isOpen && (
              <div className="acc-content" onClick={e => e.stopPropagation()}>
                {(tab.type === 'editor' || tab.type === 'sidebar') && (
                  <div className="floating-actions">
                    <button
                      className={`icon-btn${isEditing ? ' icon-btn--active' : ''}`}
                      onClick={() => setIsEditing(e => !e)}
                      title={isEditing ? 'Switch to Read mode' : 'Switch to Edit mode'}
                    >
                      {isEditing ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      )}
                    </button>
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
                )}
                <div className="acc-body">
                  {tab.type === 'sidebar' && (
                    <div className="file-list" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                      {fileTree.map((item, i) => <FileSystemItem key={i} item={item} onSelectFile={loadFile} activeFile={fileName} />)}
                    </div>
                  )}
                  {tab.type === 'chat' && (
                    <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
                      <Chat isEmbedded={true} />
                    </div>
                  )}
                  {tab.type === 'editor' && (
                    <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <article className="markdown-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
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
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

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
