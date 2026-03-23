"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pencil } from 'lucide-react';
import Chat from './components/Chat';
import { ensureLibsLoaded, postProcess, fitHeading } from './components/MarkdownEngine';
import FileSystemItem from './components/FileSystemItem';
import BlockEditor, { readCache } from './components/BlockEditor';
import VaultStyles from './components/VaultStyles';
import StickySpine from './components/StickySpine';
import MobileFooter from './components/MobileFooter';
import PromptOverlays from './components/PromptOverlays';
import FloatingActions from './components/FloatingActions';
import dynamic from 'next/dynamic';

const GraphView = dynamic(() => import('./components/GraphView'), { ssr: false });

// ─── MAIN VAULT ───────────────────────────────────────────────────────────────
const DEFAULT_FILE = process.env.NEXT_PUBLIC_DEFAULT_VAULT_FILE || "chat";

export default function CaseClient({ staticRecords = [] }) {
  const [fileTree,    setFileTree]    = useState([]);
  const [content,     setContent]     = useState('');
  const [fileName,    setFileName]    = useState('');
  const [contentKey,  setContentKey]  = useState(0);
  const [isEditing,   setIsEditing]   = useState(false);
  const [saveStatus,  setSaveStatus]  = useState('idle');
  const [fileSha,     setFileSha]     = useState(null);
  const [editPass,    setEditPass]    = useState(() => { try { return sessionStorage.getItem('vault_edit_pass') || ''; } catch { return ''; } });
  const [passPrompt,  setPassPrompt]  = useState(null);
  const [namePrompt,  setNamePrompt]  = useState(null);
  const [commentPrompt, setCommentPrompt] = useState(null);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [showSearch,   setShowSearch]  = useState(false);
  const [viewMode,     setViewMode]    = useState('graph'); // 'list' or 'graph'
  const [fullContentCache, setFullContentCache] = useState({});
  const [activeOverlay, setActiveOverlay] = useState(null); // 'filetree' or 'chat' or null
  const [showHeader, setShowHeader] = useState(true);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleGlobalScroll = (e) => {
      if (window.innerWidth > 1024) return;
      const target = e.target;
      if (!target || !target.scrollTop && target !== document.documentElement) return;
      
      const currentScrollY = target.scrollTop || window.scrollY;
      const diff = currentScrollY - (target._lastScrollY || 0);
      
      if (diff > 10 && currentScrollY > 100) {
        setShowHeader(false);
      } else if (diff < -10) {
        setShowHeader(true);
      }
      target._lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleGlobalScroll, true);
    return () => window.removeEventListener('scroll', handleGlobalScroll, true);
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

  useEffect(() => {
    if (allFiles.length > 0) {
      const fetchAll = async () => {
        const newCache = { ...fullContentCache };
        let changed = false;
        
        await Promise.all(allFiles.map(async (file) => {
          if (!newCache[file.id] && file.path) {
            try {
              const res = await fetch(file.path);
              const text = await res.text();
              newCache[file.id] = text;
              serverRawCache.current[file.id] = text; // Fill raw cache for SEO/Bots
              changed = true;
            } catch (e) {
              console.error("Failed to pre-fetch:", file.id, e);
            }
          }
        }));
        
        if (changed) setFullContentCache(newCache);
      };
      fetchAll();
    }
  }, [allFiles]);

  const decodeBase64 = (str) => {
    if (!str) return '';
    try {
      return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      console.warn("Base64 decode falling back to simple atob", e);
      return atob(str);
    }
  };

  const fileRegistry   = useRef({});
  const serverRawCache = useRef({});
  const appShellRef    = useRef(null);
  const saveHandlerRef = useRef(null); // ref to BlockEditor's save fn
  const lockIntervalRef = useRef(null);
  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15));
  // Custom Smooth Scrolling States
  const isTabScrolling = useRef(false);
  const tabAnimId = useRef(null);
  const targetScrollX  = useRef(null);
  const isWheelScrollingX = useRef(false);

  const verticalScrollTargets = useRef(new Map());
  const isWheelScrollingY = useRef(new Map());
  const lastActiveNote = useRef(null); // Keep track of the actual note open behind overlay

  // Handle global click to toggle video interactability
  useEffect(() => {
    const handleMouseDown = (e) => {
      const container = e.target.closest('.video-container');
      if (container && !container.classList.contains('interactable')) {
        // Break the glass
        container.classList.add('interactable');
        
        // Repair the glass after 1s
        // This allows the current click to pass through to the iframe
        // and keeps interaction window narrow to prevent scroll theft
        setTimeout(() => {
          container.classList.remove('interactable');
        }, 1000);
      }
    };
    
    const handleWheelRestore = () => {
      document.querySelectorAll('.video-container.interactable').forEach(c => {
        c.classList.remove('interactable');
      });
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('wheel', handleWheelRestore, { passive: true });
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('wheel', handleWheelRestore);
    };
  }, []);

  const askPassword = useCallback(() => new Promise((resolve, reject) => {
    setPassPrompt({ resolve, reject });
  }), []);

  const askFileName = useCallback((defaultValue = "", title = "") => new Promise((resolve, reject) => {
    setNamePrompt({ resolve, reject, defaultValue, title });
  }), []);

  const askComment = useCallback((defaultValue = "") => new Promise((resolve, reject) => {
    setCommentPrompt({ resolve, reject, defaultValue });
  }), []);

  // Accordion state
  const [openFiles, setOpenFiles] = useState([]); // Array of { id, path, name, serverPath, fetchedContent }
  const [activeTab, setActiveTab] = useState(null); 

  const applyFileContent = useCallback((repoKey, newContent) => {
    React.startTransition(() => {
      setFileName(repoKey);
      setContent(newContent);
      setContentKey(k => k + 1);
      setIsAtBottom(false);
    });
  }, []);

  const loadFile = useCallback(async (path, name, serverPath = null, historyMode = 'push', activate = true) => {
    if (activate) {
      setActiveOverlay(null);
      if (serverPath) setActiveTab(serverPath);
    }
    setIsAtBottom(false);
    let repoKey;
    let newContent = '';

    if (!path) {
      repoKey = serverPath || name;
      const cached = readCache(repoKey);
      newContent = Array.isArray(cached) && cached.length > 0
        ? cached.map(b => b.raw).join('\n\n')
        : `# ${name.replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`;
      applyFileContent(repoKey, newContent);
    } else {
      try {
        const urlParts = new URL(path, window.location.origin).pathname.split('/').slice(1);
        // GitHub raw URLs: /user/repo/branch/path/to/file.md -> slice(3) gives path/to/file.md
        repoKey = serverPath || decodeURIComponent(urlParts.slice(3).join('/'));

        // Ưu tiên gọi API để lấy bản mới nhất ngay khi người dùng click
        const apiRes = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get', path: repoKey })
        });
        const data = await apiRes.json();

        if (data.ok && data.content) {
          newContent = decodeBase64(data.content);
          if (data.sha) setFileSha(data.sha);
        } else {
          // Fallback sang CDN nếu API lỗi
          const res  = await fetch(path);
          newContent = await res.text();
        }

        serverRawCache.current[repoKey] = newContent;
        applyFileContent(repoKey, newContent);
      } catch { 
        repoKey = serverPath || name;
        applyFileContent(repoKey, '# Error\nFailed to load.');
      }
    }

    if (repoKey && repoKey !== 'error') {
      setOpenFiles(prev => {
        if (!prev.find(f => f.id === repoKey)) {
          return [...prev, { id: repoKey, path, name, serverPath: repoKey, fetchedContent: newContent }];
        }
        return prev.map(f => f.id === repoKey ? { ...f, fetchedContent: newContent } : f);
      });
      if (activate) setActiveTab(repoKey);

      // Update URL
      if (activate) {
        const cleanPath = repoKey.replace(/\.md$/, '');
        const newUrl = `/case/${cleanPath}`;
        if (window.location.pathname !== newUrl) {
          if (historyMode === 'replace') {
            window.history.replaceState({ repoKey }, '', newUrl);
          } else if (historyMode === 'push') {
            window.history.pushState({ repoKey }, '', newUrl);
          }
        }
      }
    }
  }, [applyFileContent]);

  const refreshTree = useCallback(async () => {
    try {
      const tree = await fetch('/api/cases', { cache: 'no-store' }).then(r => r.json());
      if (!Array.isArray(tree)) return;
      
      const newRegistry = {};
      const buildReg = (nodes, repoPath = '') => nodes.forEach(n => {
        if (n.kind === 'file') {
          const fullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
          newRegistry[fullRepoPath.toLowerCase()] = n.path;
          newRegistry[n.name.toLowerCase()] = n.path;
          newRegistry[n.name.replace('.md', '').toLowerCase()] = n.path;
        } else if (n.children) {
          buildReg(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
        }
      });
      buildReg(tree);
      fileRegistry.current = newRegistry;
      setFileTree(tree);
      // Force a slight state change to ensure registry-dependent components re-render
      setContentKey(k => k + 0.0000001); 
    } catch (e) {
      console.error("Failed to refresh tree:", e);
    }
  }, []);

  const handleRenameFile = async (oldPath) => {
    let newPath;
    try {
      newPath = await askFileName(oldPath, "Rename/Move file (enter full path)");
    } catch (e) {
      return;
    }
    if (!newPath || newPath === oldPath) return;

    try {
      const pass = editPass || await askPassword();
      setEditPass(pass);
      try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}

      const lockData = await acquireLock(oldPath, pass);
      const sha = lockData.sha;

      setSaveStatus('saving');
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'rename', 
          path: oldPath, 
          newPath: newPath,
          password: pass,
          sessionId: sessionIdRef.current,
          sha: sha
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Clear caches to force re-fetch and link update reflection
      setFullContentCache({});
      serverRawCache.current = {};
      
      await refreshTree();
      
      if (fileName === oldPath) {
        setFileName(newPath);
        const cleanPath = newPath.replace(/\.md$/, '');
        window.history.replaceState({ repoKey: newPath }, '', `/case/${cleanPath}`);
        
        // Re-load the renamed file to get its content (it might have been updated too if it had links to itself)
        const newRegistryEntry = fileRegistry.current[newPath.toLowerCase()];
        if (newRegistryEntry) {
          loadFile(newRegistryEntry, newPath.split('/').pop(), newPath, 'replace');
        }
      } else {
        // If we renamed another file, reload current file to see updated links
        const currentPath = fileName;
        const currentRegistryEntry = fileRegistry.current[currentPath?.toLowerCase()];
        if (currentRegistryEntry) {
          loadFile(currentRegistryEntry, currentPath.split('/').pop(), currentPath, 'replace');
        }
      }

      releaseLock(newPath, pass);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      if (e.message === 'cancelled') return;
      alert("Error renaming: " + e.message);
    }
  };

  const handleDeleteFile = async (filePath) => {
    if (!window.confirm(`Are you sure you want to delete "${filePath}"?`)) return;

    try {
      const pass = editPass || await askPassword();
      setEditPass(pass);
      try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}

      const lockData = await acquireLock(filePath, pass);
      const sha = lockData.sha;

      setSaveStatus('saving');
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete', 
          path: filePath, 
          password: pass,
          sessionId: sessionIdRef.current,
          sha: sha
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Clear caches
      setFullContentCache({});
      serverRawCache.current = {};

      await refreshTree();
      
      if (fileName === filePath) {
        setActiveTab(null);
        window.history.replaceState({ repoKey: null }, '', '/case');
      } else {
        // Reload current file to see updated links (they might become broken/dimmed)
        const currentPath = fileName;
        const currentRegistryEntry = fileRegistry.current[currentPath?.toLowerCase()];
        if (currentRegistryEntry) {
          loadFile(currentRegistryEntry, currentPath.split('/').pop(), currentPath, 'replace');
        }
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      if (e.message === 'cancelled') return;
      alert("Error deleting: " + e.message);
    }
  };

  useEffect(() => {

    (async () => {
      try {
        // Fetch rawTree directly and initialize state to avoid stale closures
        const rawTree = await fetch('/api/cases', { cache: 'no-store' }).then(r => r.json());
        if (!Array.isArray(rawTree)) { setContent(`# API Error\n${rawTree.error || 'Unknown'}`); return; }
        
        // Re-populate registry and state from this fresh fetch
        const newRegistry = {};
        const buildReg = (nodes, repoPath = '') => nodes.forEach(n => {
          if (n.kind === 'file') {
            const fullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
            newRegistry[fullRepoPath.toLowerCase()] = n.path;
            newRegistry[n.name.toLowerCase()] = n.path;
            newRegistry[n.name.replace('.md', '').toLowerCase()] = n.path;
          } else if (n.children) {
            buildReg(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
          }
        });
        buildReg(rawTree);
        fileRegistry.current = newRegistry;
        setFileTree(rawTree);

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        let targetFile = DEFAULT_FILE;
        let forceTab = (targetFile === 'chat' || targetFile === 'filetree') ? targetFile : null;

        // Insert /case buffer into history if landing deep
        if (pathParts[0] === 'case') {
          const currentSlug = pathParts.length > 1 ? pathParts.slice(1).map(decodeURIComponent).join('/') : DEFAULT_FILE;
          const currentRepoKey = (currentSlug === 'chat' || currentSlug === 'filetree') ? currentSlug : currentSlug + '.md';
          
          window.history.replaceState({ repoKey: null }, '', '/case');
          window.history.pushState({ repoKey: currentRepoKey }, '', window.location.pathname === '/case' ? `/case/${currentSlug}` : window.location.pathname);
        }

        if (pathParts.length > 1 && pathParts[0] === 'case') {
          const slugParts = pathParts.slice(1).map(decodeURIComponent);
          const slugStr = slugParts.join('/');
          forceTab = null;

          // Check if the slug matches a static record (e.g., 'faq', 'case-info')
          const staticMatch = staticRecords.find(r => r.id.replace('system::', '') === slugStr);
          if (staticMatch) {
            setActiveTab(staticMatch.id);
            applyFileContent(staticMatch.id, staticMatch.content);
            return; // Handled as static record
          }

          if (slugStr === 'chat') {
            forceTab = 'chat';
          } else if (slugStr === 'filetree') {
            forceTab = 'filetree';
          } else {
            targetFile = slugStr + '.md';
          }
        }

        // Find file in registry with full repo path to match tab ID
        const findFile = (nodes, target, repoPath = '') => {
          for (const n of nodes) {
            const currentFullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
            if (n.kind === 'file' && currentFullRepoPath.toLowerCase() === target.toLowerCase()) {
              return { path: n.path, name: n.name, id: currentFullRepoPath };
            }
            if (n.children) {
              const found = findFile(n.children, target, currentFullRepoPath);
              if (found) return found;
            }
          }
          return null;
        };
        
        // Use rawTree instead of stale fileTree state
        const db = findFile(rawTree, targetFile);
        setTimeout(() => {
          if (db) {
            loadFile(db.path, db.name, db.id, 'replace', !forceTab);
            if (forceTab) {
              setActiveOverlay(forceTab);
              const newUrl = `/case/${forceTab}`;
              if (window.location.pathname !== newUrl) {
                window.history.replaceState({ repoKey: forceTab }, '', newUrl);
              }
            }
          } else {
            // Check registry for targetFile before falling back (handles flat names and missing .md)
            const cleanTarget = targetFile.toLowerCase();
            const regPath = fileRegistry.current[cleanTarget] || 
                            fileRegistry.current[cleanTarget.replace('.md', '')];
            
            if (regPath) {
              const baseName = targetFile.split('/').pop();
              loadFile(regPath, baseName, targetFile, 'replace', !forceTab);
            } else {
              // Final fallback to default file if URL path not found
              const fallbackDb = findFile(rawTree, DEFAULT_FILE);
              if (fallbackDb) {
                loadFile(fallbackDb.path, fallbackDb.name, fallbackDb.id, 'replace', !forceTab);
              } else {
                const p = fileRegistry.current[DEFAULT_FILE.toLowerCase()];
                if (p) {
                  loadFile(p, DEFAULT_FILE, null, 'replace', !forceTab);
                }
              }
              
              if (forceTab) {
                setActiveOverlay(forceTab);
                const newUrl = `/case/${forceTab}`;
                if (window.location.pathname !== newUrl) {
                  window.history.replaceState({ repoKey: forceTab }, '', newUrl);
                }
              }
            }
          }
        }, 500);
      } catch (e) { 
        console.error("Initialization error:", e);
        setContent('# Connection Error\nFailed to connect to API.'); 
      }
    })();
  }, [loadFile, staticRecords, applyFileContent]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.repoKey) {
          const repoKey = e.state.repoKey;
          
          // 1. Handle special tabs
          if (repoKey === 'chat' || repoKey === 'filetree') {
            setActiveOverlay(repoKey);
            return;
          }

          setActiveOverlay(null);
          // 2. Handle static system records
          if (typeof repoKey === 'string' && repoKey.startsWith('system::')) {
            const staticMatch = staticRecords.find(r => r.id === repoKey);
            if (staticMatch) {
              setActiveTab(staticMatch.id);
              applyFileContent(staticMatch.id, staticMatch.content);
              return;
            }
          }

          // 3. Handle regular files from API
          const cleanPath = repoKey.toLowerCase();
          const realPath = fileRegistry.current[cleanPath];
          if (realPath) {
            const name = repoKey.split('/').pop();
            loadFile(realPath, name, repoKey, 'none');
          }
        } else {
          setActiveTab(null);
          setActiveOverlay(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadFile, staticRecords, applyFileContent]);

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

  const filteredTree = React.useMemo(() => {
    const filterNodes = (nodes, forceOpen = false) => {
      return nodes.reduce((acc, node) => {
        const matches = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (node.kind === 'directory' && node.children) {
          const filteredChildren = filterNodes(node.children, forceOpen);
          if (filteredChildren.length > 0 || matches || forceOpen) {
            acc.push({
              ...node,
              children: filteredChildren,
              // Force directory open if it has matching children or matches itself OR if forceOpen is true
              isOpen: forceOpen || filteredChildren.length > 0 || matches 
            });
          }
        } else if (matches || !searchTerm) {
          acc.push(node);
        }
        
        return acc;
      }, []);
    };
    
    const forceOpen = activeOverlay === 'filetree' || !!searchTerm;
    return filterNodes(fileTree, forceOpen);
  }, [fileTree, searchTerm, activeOverlay]);

  const tabs = React.useMemo(() => {
    const baseTabs = [
      { id: 'filetree', title: 'File Tree', type: 'sidebar' },
      { id: 'chat', title: 'AI Chat Vault', type: 'chat' },
    ];

    // Inject static records from server
    staticRecords.forEach(f => {
      baseTabs.push({
        id: f.id,
        title: f.name.replace('.md', ''),
        type: 'static',
        content: f.content
      });
    });
    
    if (fileTree.length === 0) {
      // Add 6 placeholder bars while loading to fill the screen
      for (let i = 0; i < 20; i++) {
        baseTabs.push({ id: `placeholder-${i}`, title: '...', type: 'placeholder' });
      }
      return baseTabs;
    }

    const sortedFiles = [...allFiles].sort((a, b) => a.name.localeCompare(b.name));

    sortedFiles.forEach(f => {
      baseTabs.push({ 
        id: f.id, 
        title: f.name.replace('.md', ''), 
        type: 'editor', 
        fileData: f 
      });
    });

    return baseTabs;
  }, [allFiles, fileTree.length]);

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
    const initContent = `# ${title}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`;
    applyFileContent(serverPath, initContent);

    setOpenFiles(prev => {
      if (!prev.find(f => f.id === serverPath)) {
        return [...prev, { id: serverPath, path: null, name: displayName, serverPath, fetchedContent: initContent }];
      }
      return prev;
    });
    setActiveTab(serverPath);
    setActiveOverlay(null);

  }, [applyFileContent]);

  const handleLinkClick = useCallback((e) => {
    // 1. Handle external links (<a> tags starting with http/https)
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && /^https?:\/\//.test(href)) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      // If it's a footnote or hash link, let it be handled normally
      if (href && href.startsWith('#')) return;
    }

    // 2. Handle internal Wiki-style links
    const internalLink = e.target.closest('.internal-link');
    if (!internalLink) return;

    e.preventDefault();
    const target     = internalLink.getAttribute('data-target') || internalLink.innerText;
    const serverPath = resolveWikiPath(target);
    const key        = serverPath.toLowerCase();
    const baseName   = serverPath.split('/').pop().toLowerCase();
    const realPath   = fileRegistry.current[key] ?? fileRegistry.current[baseName];

    if (typeof realPath === 'string') {
      const existingTab = tabs.find(t => t.fileData?.path === realPath);
      if (existingTab) {
        loadFile(realPath, existingTab.fileData.name, existingTab.id);
      } else {
        loadFile(realPath, serverPath.split('/').pop(), serverPath);
      }
    } else if (realPath === null) {
      setActiveTab(serverPath);
      const openF = openFiles.find(f => f.id === serverPath);
      if (openF) {
        const cached = readCache(serverPath);
        const raw = Array.isArray(cached) && cached.length > 0
          ? cached.map(b => b.raw).join('\n\n')
          : openF.fetchedContent;
        applyFileContent(serverPath, raw);
        } else {
        applyFileContent(serverPath, `# ${serverPath.split('/').pop().replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n*links:*\n`);
        }    } else {
      createAndOpenFile(target);
    }
  }, [loadFile, createAndOpenFile, openFiles, tabs, applyFileContent]);

  const doPost = useCallback(async (filePath, raw, pass) => {
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
        sha: fileSha
      }),
    });
    if (res.status === 403) return { wrongPass: true };
    if (res.status === 423) throw new Error('locked_by_other');
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    if (data.sha) setFileSha(data.sha);

    // Update server cache and clear local draft for THIS file only
    serverRawCache.current[filePath] = raw;
    setContent(raw);
    try { localStorage.removeItem(`vault_v3::${filePath}`); } catch {}

    if (isNew) await refreshTree();
    return { ok: true };
  }, [refreshTree, fileSha]);

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
      try { sessionStorage.removeItem('vault_edit_pass'); } catch {}
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
  }, [fileName, saveOneFile]);

  const handleSidebarSave = useCallback(async () => {
    if (!saveHandlerRef.current) return;
    setSaveStatus('saving');
    try {
      await saveHandlerRef.current();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      if (e.message === 'locked_by_other') {
        alert("Cannot save. File is locked by another user.");
      }
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, []);

  // Helper to ping the server and lock the file
  const acquireLock = async (targetPath, pass) => {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'lock', 
        path: targetPath, 
        password: pass,
        sessionId: sessionIdRef.current 
      })
    });
    if (res.status === 403) throw new Error('wrong_pass');
    if (res.status === 423) throw new Error('locked_by_other');
    if (!res.ok) throw new Error('lock_failed');
    return await res.json();
  };

  // Helper to explicitly unlock
  const releaseLock = (targetPath, pass) => {
    fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'unlock', 
        path: targetPath, 
        password: pass,
        sessionId: sessionIdRef.current 
      }),
      keepalive: true
    }).catch(() => {});
  };

  // 1. Handle creating a new note
  const handleCreateNewNote = async () => {
    let noteName;
    try {
      noteName = await askFileName();
    } catch (e) {
      return;
    }
    if (!noteName) return;
    const cleanName = noteName.endsWith('.md') ? noteName : `${noteName}.md`;
    const targetPath = `notes/${cleanName}`;

    // 1. Kiểm tra nhanh trong registry hiện tại
    const exists = fileRegistry.current[targetPath.toLowerCase()] || 
                   fileRegistry.current[cleanName.toLowerCase()] ||
                   fileRegistry.current[noteName.toLowerCase()];
    
    if (exists) {
      alert(`Note "${noteName}" already exists!`);
      return;
    }
    
    // 2. Kiểm tra trên server qua acquireLock
    try {
      const lockData = await acquireLock(targetPath, editPass);
      
      if (lockData.ok && lockData.content) {
        // Nếu đã có trên GitHub, thông báo và thoát, không vào edit mode
        alert(`Note "${noteName}" already exists on the server!`);
        releaseLock(targetPath, editPass);
        return;
      } 

      // 3. Chỉ khi là file thực sự mới thì mới tiến hành
      createAndOpenFile(targetPath);
      setFileSha(null);
      setIsEditing(true);
      setActiveTab(targetPath);
      
      // Start keep-alive loop (ping every 20 seconds)
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
      lockIntervalRef.current = setInterval(() => {
        acquireLock(targetPath, editPass).catch(() => {
          clearInterval(lockIntervalRef.current);
          setIsEditing(false);
          alert("Connection lost or file locked by another user. Returning to view mode.");
        });
      }, 20000);

    } catch (e) {
      if (e.message === 'locked_by_other') {
        alert("Cannot create. A file with this name is currently being edited by another user.");
      } else {
        // Fallback for any other error: just create locally
        createAndOpenFile(targetPath);
        setFileSha(null);
        setIsEditing(true);
        setActiveTab(targetPath);
      }
    }
  };

  const handleAppendComment = async (initialValue = "") => {
    if (!fileName || fileName === 'chat' || fileName === 'filetree') return;

    let comment;
    try {
      comment = await askComment(typeof initialValue === 'string' ? initialValue : "");
    } catch (e) {
      return;
    }
    if (!comment) return;

    try {
      const pass = editPass || "";

      // 1. Acquire lock and get latest content from server
      const lockData = await acquireLock(fileName, pass);
      const freshContent = decodeBase64(lockData.content);
      const currentSha = lockData.sha;
      
      // 2. Prepare new content
      const commentEntry = `"${comment}"`;
      let updatedContent;
      
      // Regex robust hơn để tìm khối Comments, hỗ trợ khoảng trắng và không phân biệt hoa thường
      const detailsRegex = /<details[^>]*>\s*<summary>\s*Comments\s*<\/summary>([\s\S]*?)<\/details>/i;
      const match = freshContent.match(detailsRegex);
      
      if (match) {
        const oldInner = match[1].trim();
        // Sử dụng \n thay vì \n\n giữa các comment để chúng nằm sát nhau hơn
        const newInner = `\n\n${commentEntry}\n${oldInner}\n\n`;
        const newBlock = `<details>\n<summary>Comments</summary>${newInner}</details>`;
        
        // Sử dụng substring để thay thế chính xác vị trí match
        updatedContent = freshContent.substring(0, match.index) + newBlock + freshContent.substring(match.index + match[0].length);
      } else {
        // Tạo mới khối Comments ở đầu file
        updatedContent = `<details>\n<summary>Comments</summary>\n\n${commentEntry}\n\n</details>\n\n` + freshContent.trim();
      }
      
      // 3. Post updated content (Commit)
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: fileName, 
          content: updatedContent, 
          password: pass,
          comment: true,
          sessionId: sessionIdRef.current,
          sha: currentSha
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // 4. Update all local states to ensure everything is "fresh"
      if (data.sha) setFileSha(data.sha);
      serverRawCache.current[fileName] = updatedContent;
      
      // Update openFiles registry for tab consistency
      setOpenFiles(prev => prev.map(f => f.id === fileName ? { ...f, fetchedContent: updatedContent } : f));
      
      // Force refresh of the view
      setContent(updatedContent);
      setContentKey(k => k + 1);
      
      // Clear any local drafts to ensure next load is from server
      try { localStorage.removeItem(`vault_v3::${fileName}`); } catch {}
      
      // 5. Release lock
      releaseLock(fileName, pass);
      
    } catch (e) {
      if (e.message === 'cancelled') return;
      if (e.message === 'locked_by_other') {
        alert("Cannot add comment. File is locked by another user.");
      } else {
        alert("Error adding comment: " + e.message);
      }
      // Return comment to user by re-triggering the prompt
      handleAppendComment(comment);
    }
  };

  // 2. Custom Toggle Edit Logic
  const handleToggleEditMode = async () => {
    if (isEditing) {
      // Exiting Edit Mode -> unlock and switch to view
      clearInterval(lockIntervalRef.current);
      if (editPass && fileName) releaseLock(fileName, editPass);
      setIsEditing(false);
      return;
    }

    // Entering Edit Mode
    const registryEntry = fileRegistry.current[fileName?.toLowerCase()];
    const isLocalNew = registryEntry === null;

    if (isLocalNew) {
      setIsEditing(true); // Free pass for newly created files
      return;
    }

    // For existing files: Always prompt for password to ensure security
    try {
      const pass = await askPassword();
      const lockData = await acquireLock(fileName, pass);
      
      if (lockData.ok && lockData.content) {
        const freshContent = decodeBase64(lockData.content);
        const currentContent = (serverRawCache.current[fileName] || "").trim();
        
        if (freshContent.trim() !== currentContent && currentContent !== "") {
          const confirmUpdate = window.confirm("This file has been updated on GitHub. Do you want to load the latest version? (Your local draft will be overwritten)");
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
      
      // Refresh the entire file tree to see if other files were added/changed
      await refreshTree();
      
      setEditPass(pass);
      try { sessionStorage.setItem('vault_edit_pass', pass); } catch {}
      setIsEditing(true);
      
      // Start keep-alive loop (ping every 20 seconds)
      if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
      lockIntervalRef.current = setInterval(() => {
        acquireLock(fileName, pass).catch(() => {
          clearInterval(lockIntervalRef.current);
          setIsEditing(false);
          alert("Connection lost or file locked by another user. Returning to view mode.");
        });
      }, 20000);
    } catch (e) {
      if (e.message === 'cancelled') return;
      if (e.message === 'wrong_pass') {
        alert("Incorrect password!");
      } else {
        alert("Cannot edit right now. File might be locked by another user.");
      }
    }
  };

  const scrollToTab = useCallback((tabId) => {
    if (!appShellRef.current) return;
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) return;

    // Skip horizontal scroll animation for overlay tabs to keep background stable
    if (tabId === 'filetree' || tabId === 'chat') return;

    if (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth || window.innerWidth <= 768) {
      // Vertical scroll for mobile
      const scrollTarget = tabIndex * 50; 
      appShellRef.current.scrollTo({ top: scrollTarget, behavior: 'smooth' });
    } else {
      isTabScrolling.current = true;
      targetScrollX.current = null;
      if (tabAnimId.current) cancelAnimationFrame(tabAnimId.current);

      const spineWidth = 150;
      // Centering logic: 
      // 1. Sticky spine is 150px.
      // 2. Tabs at index 0 (filetree) and 1 (chat) are display:none when closed.
      // 3. Visible closed tabs before target index are (tabIndex - 2).
      // 4. Position = 150 + (tabIndex - 2) * 150.
      // 5. To center the 100vw-450px panel, its left edge should be at 225px from viewport left.
      const visibleClosedBefore = Math.max(0, tabIndex - 2);
      const tabPosition = 150 + (visibleClosedBefore * spineWidth);
      const scrollTarget = Math.max(0, tabPosition - 225);
      
      const startScroll = appShellRef.current.scrollLeft;
      const distance = scrollTarget - startScroll;
      const duration = 600; 
      let startStart = null;
      
      const step = (timestamp) => {
        if (!startStart) startStart = timestamp;
        const progress = Math.min((timestamp - startStart) / duration, 1);
        // easeOutQuart: fast start, smooth but firm finish
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
  }, [tabs]);

  useEffect(() => {
    if (activeTab && !activeOverlay) {
      scrollToTab(activeTab);
    }
  }, [activeTab, activeOverlay, scrollToTab]);

  useEffect(() => {
    const checkBottom = () => {
      const container = document.querySelector('.acc-panel.open .markdown-container');
      if (container) {
        const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
        setIsAtBottom(atBottom);
      } else {
        // If it's chat or filetree, we might want a different logic, but for now:
        setIsAtBottom(false);
      }
    };
    // Wait for content to render and animations to finish
    const timer = setTimeout(checkBottom, 400);
    return () => clearTimeout(timer);
  }, [content, activeTab, activeOverlay, tabs.length]);

  const handleTabClick = async (tab, e) => {
    if (tab.id === 'filetree' || tab.id === 'chat') {
      setActiveOverlay(prev => prev === tab.id ? null : tab.id);
      return;
    }

    if (activeTab === tab.id) {
      if (activeOverlay) setActiveOverlay(null);
      return;
    }
    
    setActiveOverlay(null);
    // Check for unsaved changes before switching away
    if (isEditing && fileName) {
      const cached = readCache(fileName);
      const raw = Array.isArray(cached) && cached.length > 0 
        ? cached.map(b => b.raw).join('\n\n') 
        : content;
      const serverRaw = serverRawCache.current[fileName] || "";
      
      if (raw.trim() !== serverRaw.trim()) {
        const wantsToSave = window.confirm("You have unsaved changes. Do you want to save before leaving?");
        if (wantsToSave) {
          await handleSaveFile(raw);
        }
      }
      // Clean up lock and exit edit mode
      clearInterval(lockIntervalRef.current);
      if (editPass) releaseLock(fileName, editPass);
      setIsEditing(false);
    }

    // Capture the note we are coming from if it's not an overlay
    if (activeTab !== 'filetree' && activeTab !== 'chat' && activeTab !== null) {
      lastActiveNote.current = activeTab;
    }

    setActiveTab(tab.id);
    if (tab.id === 'filetree') setShowSearch(true);
    
    if (tab.type === 'static') {
      applyFileContent(tab.id, tab.content);
      const cleanPath = tab.id.replace('system::', '');
      window.history.pushState({ repoKey: tab.id }, '', `/case/${cleanPath}`);
    } else if (tab.type === 'editor') {
      const cached = readCache(tab.id);
      const openedF = openFiles.find(f => f.id === tab.id);

      if (Array.isArray(cached) && cached.length > 0) {
        applyFileContent(tab.id, cached.map(b => b.raw).join('\n\n'));
      } else if (openedF && openedF.fetchedContent) {
        applyFileContent(tab.id, openedF.fetchedContent);
      } else if (tab.fileData && tab.fileData.path) {
        loadFile(tab.fileData.path, tab.fileData.name, tab.id, 'push');
      } else {
        applyFileContent(tab.id, `# ${tab.title}\nLoading...`);
      }

      // Update URL when clicking tab
      const cleanPath = tab.id.replace(/\.md$/, '');
      const newUrl = `/case/${cleanPath}`;
      if (window.location.pathname !== newUrl) {
        window.history.pushState({ repoKey: tab.id }, '', newUrl);
      }
    } else {
      // DO NOT update URL for filetree or chat overlays
      // These are now purely internal UI toggles
    }
  };


  // Implement mouse wheel horizontal scrolling
  useEffect(() => {
    const handleWheel = (e) => {
      if (!appShellRef.current || e.deltaY === 0 || e.shiftKey) return;
      if (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth || window.innerWidth <= 768) return;

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

      const vScrollable = e.target.closest('.markdown-container, .file-list, .chat-history');
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
              
              if (Math.abs(diff) < 0.2) {
                vScrollable.scrollTop = currentTarget;
                isWheelScrollingY.current.set(vScrollable, false);
                verticalScrollTargets.current.delete(vScrollable);
              } else {
                vScrollable.scrollTop += diff * 0.15; // Snappier response
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
      
      // Increased multiplier for faster horizontal scroll
      targetScrollX.current += e.deltaY * 2.0; 
      targetScrollX.current = Math.max(0, Math.min(targetScrollX.current, shell.scrollWidth - shell.clientWidth));
      
      if (!isWheelScrollingX.current) {
        isWheelScrollingX.current = true;
        const animate = () => {
          if (!shell || targetScrollX.current === null) {
            isWheelScrollingX.current = false;
            return;
          }
          const diff = targetScrollX.current - shell.scrollLeft;
          if (Math.abs(diff) < 0.2) {
            shell.scrollLeft = targetScrollX.current;
            isWheelScrollingX.current = false;
            targetScrollX.current = null;
          } else {
            shell.scrollLeft += diff * 0.1; // Faster horizontal response
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

  const graphFiles = React.useMemo(() => allFiles.map(f => ({
    ...f,
    fetchedContent: fullContentCache[f.id] || openFiles.find(of => of.id === f.id)?.fetchedContent || ""
  })), [allFiles, fullContentCache, openFiles]);

  const activeTabIndex = tabs.findIndex(t => t.id === activeTab);
  const nextTabForActive = tabs.slice(activeTabIndex + 1).find(t => t.type === 'editor' || t.type === 'static');
  const showReadMore = isAtBottom && !isFooterExpanded && nextTabForActive && !activeOverlay;

  return (
    <div className={`accordion-app ${activeTab || activeOverlay ? 'has-active' : ''} ${activeOverlay === 'filetree' ? 'filetree-active' : ''} ${activeOverlay === 'chat' ? 'chat-active' : ''}`} ref={appShellRef}>
        <div className="case-background"></div>
        <div className="video-overlay"></div>

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

      {tabs.map((tab, index) => {
        const isOverlay = tab.id === 'filetree' || tab.id === 'chat';
        const isOpen = isOverlay ? activeOverlay === tab.id : activeTab === tab.id;
        const isPersistent = tab.id === 'chat' || tab.id === activeTab;

        return (
          <div 
            key={tab.id} 
            className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-${tab.id}`}
            data-tab-id={tab.id}
          >
            <div className="acc-spine-container" onClick={(e) => handleTabClick(tab, e)}>
              <div className="acc-spine">
                {tab.title}
              </div>
              {isOpen && (
                <div className="mobile-back-btn" onClick={(e) => { 
                  e.stopPropagation(); 
                  if (isOverlay) {
                    setActiveOverlay(null);
                  } else {
                    window.history.back(); 
                  }
                }}>
                  <ArrowLeft size={24} />
                </div>
              )}
            </div>
            
            {(isOpen || isPersistent) && (
              <div 
                className="acc-content" 
                onClick={e => e.stopPropagation()}
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
                          const target = e.target;
                          const atBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
                          if (atBottom !== isAtBottom) setIsAtBottom(atBottom);
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
                            position: 'absolute',
                            bottom: '30px',
                            right: '30px',
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--colorone)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 200,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            color: 'black'
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
        passPrompt={passPrompt}
        setPassPrompt={setPassPrompt}
        namePrompt={namePrompt}
        setNamePrompt={setNamePrompt}
        commentPrompt={commentPrompt}
        setCommentPrompt={setCommentPrompt}
      />

      <VaultStyles />
    </div>
  );
}
