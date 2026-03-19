"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, ArrowLeft, Pencil, Share2, Folder, MessageSquare } from 'lucide-react';
import Chat from './components/Chat';
import { ensureLibsLoaded, postProcess, fitHeading } from './components/MarkdownEngine';
import FileSystemItem from './components/FileSystemItem';
import BlockEditor, { readCache } from './components/BlockEditor';
import VaultStyles from './components/VaultStyles';
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
  const [viewMode,     setViewMode]    = useState('list'); // 'list' or 'graph'
  const [fullContentCache, setFullContentCache] = useState({});
  const [activeOverlay, setActiveOverlay] = useState(null); // 'filetree' or 'chat' or null
  const [showHeader, setShowHeader] = useState(true);
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
    if (viewMode === 'graph' && allFiles.length > 0) {
      const fetchAll = async () => {
        const newCache = { ...fullContentCache };
        let changed = false;
        
        await Promise.all(allFiles.map(async (file) => {
          if (!newCache[file.id] && file.path) {
            try {
              const res = await fetch(file.path);
              const text = await res.text();
              newCache[file.id] = text;
              changed = true;
            } catch (e) {
              console.error("Failed to pre-fetch for graph:", file.id, e);
            }
          }
        }));
        
        if (changed) setFullContentCache(newCache);
      };
      fetchAll();
    }
  }, [viewMode, allFiles]);

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

  const askPassword = useCallback(() => new Promise((resolve, reject) => {
    setPassPrompt({ resolve, reject });
  }), []);

  const askFileName = useCallback(() => new Promise((resolve, reject) => {
    setNamePrompt({ resolve, reject });
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
    });
  }, []);

  const loadFile = useCallback(async (path, name, serverPath = null, historyMode = 'push', activate = true) => {
    if (activate) {
      setActiveOverlay(null);
      if (serverPath) setActiveTab(serverPath);
    }
    let repoKey;
    let newContent = '';

    if (!path) {
      repoKey = serverPath || name;
      const cached = readCache(repoKey);
      newContent = Array.isArray(cached) && cached.length > 0
        ? cached.map(b => b.raw).join('\n\n')
        : `# ${name.replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n`;
      applyFileContent(repoKey, newContent);
    } else {
      try {
        const res  = await fetch(path);
        newContent = await res.text();
        const urlParts = new URL(path, window.location.origin).pathname.split('/').slice(1);
        // GitHub raw URLs: /user/repo/branch/path/to/file.md -> slice(3) gives path/to/file.md
        repoKey = serverPath || decodeURIComponent(urlParts.slice(3).join('/'));
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
        
        // Try to load file from URL path
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
        
        const db = findFile(tree, targetFile);
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
            // Fallback to default file if URL path not found
            const fallbackDb = findFile(tree, DEFAULT_FILE);
            if (fallbackDb) {
              loadFile(fallbackDb.path, fallbackDb.name, fallbackDb.id, 'replace', !forceTab);
              if (forceTab) {
                setActiveOverlay(forceTab);
                const newUrl = `/case/${forceTab}`;
                if (window.location.pathname !== newUrl) {
                  window.history.replaceState({ repoKey: forceTab }, '', newUrl);
                }
              }
            } else {
              const p = fileRegistry.current[DEFAULT_FILE.toLowerCase()];
              if (p) {
                loadFile(p, DEFAULT_FILE, null, 'replace', !forceTab);
                if (forceTab) {
                  setActiveOverlay(forceTab);
                  const newUrl = `/case/${forceTab}`;
                  if (window.location.pathname !== newUrl) {
                    window.history.replaceState({ repoKey: forceTab }, '', newUrl);
                  }
                }
              } else if (forceTab) {
                setActiveOverlay(forceTab);
                const newUrl = `/case/${forceTab}`;
                if (window.location.pathname !== newUrl) {
                  window.history.replaceState({ repoKey: forceTab }, '', newUrl);
                }
              }
            }
          }
        }, 500);
      } catch { setContent('# Connection Error\nFailed to connect to API.'); }
    })();
  }, [loadFile]);

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

  const refreshTree = useCallback(async () => {
    const tree = await fetch('/api/cases').then(r => r.json());
    if (!Array.isArray(tree)) return;
    const buildReg = (nodes, repoPath = '') => nodes.forEach(n => {
      if (n.kind === 'file') {
        const fullRepoPath = repoPath ? `${repoPath}/${n.name}` : n.name;
        fileRegistry.current[fullRepoPath.toLowerCase()] = n.path;
        fileRegistry.current[n.name.toLowerCase()] = n.path;
        fileRegistry.current[n.name.replace('.md', '').toLowerCase()] = n.path;
      } else if (n.children) {
        buildReg(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
      }
    });
    buildReg(tree);
    setFileTree(tree);
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
    const initContent = `# ${title}\n*author: <author>*\n*tag: [[Dash Board]]*\n`;
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
        applyFileContent(serverPath, `# ${serverPath.split('/').pop().replace('.md', '')}\n*author: <author>*\n*tag: [[Dash Board]]*\n`);
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
          if (!currentContent) {
            applyFileContent(fileName, freshContent);
          }
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
    if (activeTab) {
      scrollToTab(activeTab);
    }
  }, [activeTab, scrollToTab]);

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

  return (
    <div className={`accordion-app ${activeTab || activeOverlay ? 'has-active' : ''} ${activeOverlay === 'filetree' ? 'filetree-active' : ''} ${activeOverlay === 'chat' ? 'chat-active' : ''}`} ref={appShellRef}>
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

        .case-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          pointer-events: none;
          background-image: url('/casebg2.png');
          background-size: cover;
          background-position: center;
          background-color: black;
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
          cursor: default;
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

        .add-note-btn, .filetree-btn, .chatvault-btn {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: absolute;
          color: black;
          font-weight: bold;
          font-size: 20px;
          z-index: 100;
          transition: transform 0.2s, opacity 0.2s;
        }
        .add-note-btn:hover, .filetree-btn:hover, .chatvault-btn:hover {
          opacity: 0.7;
          transform: scale(1.1);
        }

        .add-note-btn { top: 40px; }
        .filetree-btn { top: 140px; }
        .chatvault-btn { top: 240px; }

        .acc-ope {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          font-family: 'Fredericka the Great', cursive;
          font-size: 2.8rem;
          color: black;
          mix-blend-mode: destination-out;
          user-select: none;
          position: absolute;
          bottom: 40px;
          cursor: pointer;
        }
        .ope-txt, .watson-txt {
          writing-mode: vertical-rl;
          white-space: nowrap;
          letter-spacing: 2px;
        }

        .acc-panel {
          display: flex;
          flex-direction: row;
          height: 100%;
          transition: flex-basis 1s cubic-bezier(0.25, 0.8, 0.25, 1), min-width 1s cubic-bezier(0.25, 0.8, 0.25, 1), flex-grow 1s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 1s, opacity 0.5s;
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

        /* Completely hide File Tree and Chat spines as they're now accessible via buttons */
        .acc-panel.tab-filetree.closed,
        .acc-panel.tab-chat.closed {
          display: none !important;
        }

        .acc-panel.open {
          /* Để hở ra khoảng 450px cho các spine khác */
          flex-basis: calc(100vw - 450px);
          min-width: calc(100vw - 450px);
          flex-grow: 1;
          background-color: transparent;
        }

        /* Overlay Mode for File Tree and Chat */
        .filetree-active .acc-panel.closed,
        .chat-active .acc-panel.closed {
          opacity: 0;
          pointer-events: none;
        }

        .filetree-active .acc-panel.open:not(.tab-filetree),
        .chat-active .acc-panel.open:not(.tab-chat) {
          display: none !important;
        }

        .acc-panel.tab-filetree.open,
        .acc-panel.tab-chat.open {
          position: fixed;
          left: 150px;
          top: 0;
          width: calc(100vw - 150px);
          height: 100vh;
          z-index: 45;
          flex-basis: auto !important;
          min-width: 0 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-right: none;
        }

        .acc-panel.tab-filetree .acc-spine-container,
        .acc-panel.tab-chat .acc-spine-container {
          display: none;
        }

        .acc-panel.tab-filetree .acc-content,
        .acc-panel.tab-chat .acc-content {
          width: 100%;
        }

        .acc-panel.tab-filetree .file-list {
          display: block !important;
          column-width: 280px;
          column-gap: 60px;
          height: 100%;
          padding: 60px !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
        }

        /* Top level items in file list should not break across columns */
        .acc-panel.tab-filetree .file-list > div {
          break-inside: avoid;
          margin-bottom: 30px;
        }

        /* Ensure links and text are readable against video */
        .acc-panel.tab-filetree .file-list * {
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }

        .pc-only {
          display: flex !important;
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

        /* Hide all scrollbars inside panel bodies */
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

        .mobile-back-btn {
          display: none;
        }

        @media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
          .accordion-app {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }

          .accordion-app.has-active {
            overflow: hidden !important;
          }

          .sticky-spine {
            position: fixed !important;
            top: 0;
            left: 0;
            z-index: 1000;
            width: 100% !important;
            height: 50px !important;
            flex: 0 0 50px !important;
            min-width: 0 !important;
            border-right: none !important;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1) !important;
            transition: transform 0.3s ease;
          }

          .header-hidden {
            transform: translateY(-100%);
          }

          .acc-ope-container {
            flex: 1 !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            align-items: center !important;
            justify-content: flex-start !important;
          }

          .spine-content {
            flex-direction: row !important;
            width: 100% !important;
            height: 100% !important;
            justify-content: flex-start !important;
            align-items: center !important;
            position: relative !important;
            padding: 0 20px !important;
          }

          .acc-ope {
            flex-direction: row !important;
            gap: 10px !important;
            position: static !important;
            font-size: 1.4rem !important;
            letter-spacing: 1px !important;
            text-align: left !important;
            margin: 0 !important;
            cursor: pointer;
          }

          .ope-txt, .watson-txt {
            writing-mode: horizontal-tb !important;
            white-space: nowrap !important;
          }

          .mobile-back-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1001;
            color: black;
            mix-blend-mode: destination-out;
            cursor: pointer;
          }

          .add-note-btn, .filetree-btn, .chatvault-btn {
            position: absolute !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            margin: 0 !important;
            width: 32px !important;
            height: 32px !important;
            font-size: 14px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            transition: opacity 0.2s !important;
          }

          .add-note-btn svg, .filetree-btn svg, .chatvault-btn svg {
            width: 22px !important;
            height: 22px !important;
          }

          .add-note-btn {
            right: 20px !important;
            left: auto !important;
          }
          .chatvault-btn {
            right: 60px !important;
          }
          .filetree-btn {
            right: 100px !important;
          }

          .acc-panel {
            width: 100% !important;
            flex-direction: column !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          .acc-panel.closed {
            flex: 0 0 50px !important;
            min-width: 0 !important;
            height: 50px !important;
          }

          .accordion-app.has-active .acc-panel.closed {
            display: none !important;
          }

          .acc-panel.open {
            flex: 1 !important;
            min-width: 0 !important;
            height: calc(100vh - 60px) !important;
          }

          .acc-spine-container {
            flex: 0 0 50px !important;
            width: 100% !important;
            height: 50px !important;
            padding-top: 0 !important;
            justify-content: flex-start !important;
            align-items: center !important;
            padding-left: 20px !important;
            position: relative !important;
          }

          .acc-spine {
            writing-mode: horizontal-tb !important;
            font-size: 1.1rem !important;
            letter-spacing: 1px !important;
          }

          .acc-content {
            width: 100% !important;
            height: calc(100% - 50px) !important;
            flex: 1 !important;
            animation: none !important;
            opacity: 1 !important;
          }

          .acc-body {
            height: 100% !important;
            flex: 1 !important;
            overflow-y: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          
          .floating-actions {
            top: 10px !important;
            right: 15px !important;
          }
          
          .video-background iframe {
            transform: translate(-50%, -50%) scale(2.5) !important;
          }

          .pc-only {
            display: none !important;
          }

          .acc-panel.tab-filetree.open,
          .acc-panel.tab-chat.open {
            position: relative !important;
            left: 0 !important;
            width: 100% !important;
            height: calc(100vh - 60px) !important;
            backdrop-filter: none !important;
          }

          .acc-panel.tab-filetree .acc-spine-container,
          .acc-panel.tab-chat .acc-spine-container {
            display: flex !important;
          }

          .acc-panel.tab-filetree .file-list {
            display: flex !important;
            flex-direction: column !important;
            padding: 20px !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            column-width: auto !important;
          }

          .acc-panel.tab-filetree .file-list > div {
            flex: 0 0 auto !important;
            width: 100% !important;
            margin-bottom: 20px !important;
          }

          .filetree-active .acc-panel.open:not(.tab-filetree),
          .chat-active .acc-panel.open:not(.tab-chat) {
            display: none !important;
          }
        }

        .mobile-footer {
          display: none;
        }

        @media (max-width: 1024px) and (orientation: portrait), (max-width: 768px) {
          .mobile-footer {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50px;
            background: #b09278;
            z-index: 2000;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            align-items: center;
            justify-content: space-around;
            padding: 0 10px;
            padding-bottom: env(safe-area-inset-bottom);
          }
          
          .footer-item {
            display: flex;
            align-items: center;
            justify-content: center;
            color: black;
            width: 36px;
            height: 36px;
            cursor: pointer;
          }
          
          .footer-item.add-note {
            background: black;
            color: #b09278;
            width: 42px;
            height: 42px;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }

          .add-note-btn, .filetree-btn, .chatvault-btn, .mobile-back-btn, .comment-trigger {
            display: none !important;
          }

          .acc-panel.open {
            height: calc(100vh - 110px) !important;
          }
          
          .acc-panel.tab-filetree.open,
          .acc-panel.tab-chat.open {
             height: calc(100vh - 110px) !important;
          }
        }
      `}</style>

      <div className="case-background"></div>
      <div className="video-overlay"></div>

      {/* Mobile Footer */}
      <div className="mobile-footer">
        <div className="footer-item" onClick={() => { if (activeOverlay) setActiveOverlay(null); else window.history.back(); }}>
          <ArrowLeft size={28} />
        </div>
        <div className="footer-item" onClick={() => setActiveOverlay(activeOverlay === 'filetree' ? null : 'filetree')}>
          <Folder size={28} />
        </div>
        <div className="footer-item add-note" onClick={handleCreateNewNote}>
          <Plus size={36} />
        </div>
        <div className="footer-item" onClick={() => setActiveOverlay(activeOverlay === 'chat' ? null : 'chat')}>
          <MessageSquare size={28} />
        </div>
        <div 
          className="footer-item" 
          onClick={handleAppendComment}
          style={{ opacity: (!fileName || fileName === 'chat' || fileName === 'filetree') ? 0.3 : 1 }}
        >
          <Pencil size={28} />
        </div>
      </div>

      {/* Sticky Spine */}
      <div className={`acc-panel sticky-spine ${!showHeader ? 'header-hidden' : ''}`}>
        <div className="acc-ope-container" style={{ width: '100%', flex: '1' }}>
          <div className="spine-content">
            <div className="add-note-btn" onClick={(e) => { e.stopPropagation(); handleCreateNewNote(); }} title="New Note">
              <Plus size={44} />
            </div>
            <div className="filetree-btn" onClick={(e) => { 
              e.stopPropagation(); 
              setActiveOverlay(prev => prev === 'filetree' ? null : 'filetree');
            }} title="File Tree">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="chatvault-btn" onClick={(e) => { 
              e.stopPropagation(); 
              setActiveOverlay(prev => prev === 'chat' ? null : 'chat');
            }} title="AI Chat Vault">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="acc-ope" onClick={() => window.location.href = '/'}>
              <div className="ope-txt">Ope</div>
              <div className="watson-txt">Watson</div>
            </div>
          </div>
        </div>
      </div>

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
            {/* The spine is always shown, whether open or closed */}
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
                {tab.type === 'editor' && (
                  <div className="floating-actions">
                    <button
                      className={`icon-btn${isEditing ? ' icon-btn--active' : ''}`}
                      onClick={handleToggleEditMode}
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
                      className={`icon-btn icon-btn--save${saveStatus === 'saved' ? ' icon-btn--active' : saveStatus === 'error' ? ' icon-btn--error' : saveStatus === 'saving' ? ' icon-btn--saving' : ''}`}
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
                {tab.id === 'filetree' && (
                  <div className="floating-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className={`icon-btn pc-only ${viewMode === 'graph' ? 'icon-btn--active' : ''}`} 
                      onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
                      title="Toggle Graph View"
                      style={{ display: 'none' }} /* Will be shown via CSS on PC */
                    >
                      <Share2 size={18} />
                    </button>
                    {showSearch && (
                      <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                        className="search-input"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: 'var(--txt)',
                          fontSize: '13px',
                          outline: 'none',
                          width: '150px'
                        }}
                      />
                    )}
                    <button 
                      className={`icon-btn ${showSearch ? 'icon-btn--active' : ''}`} 
                      onClick={() => {
                        setShowSearch(!showSearch);
                        if (showSearch) setSearchTerm('');
                      }}
                      title="Search notes"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                )}
                <div className="acc-body">
                  {tab.type === 'sidebar' && (
                    <>
                      {viewMode === 'list' ? (
                        <div className="file-list" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                          {filteredTree.map((item, i) => <FileSystemItem key={i} item={item} onSelectFile={loadFile} activeFile={fileName} />)}
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
                  {tab.type === 'static' && (
                    <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <article className="markdown-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        <BlockEditor
                          key={contentKey}
                          content={content}
                          fileName={fileName}
                          onLinkClick={handleLinkClick}
                          isEditing={false}
                          readOnly={true}
                        />
                      </article>
                    </main>
                  )}
                  {tab.type === 'editor' && (
                    <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                      <article className="markdown-container" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                        <BlockEditor
                          key={contentKey}
                          content={content}
                          fileName={fileName}
                          onLinkClick={handleLinkClick}
                          onSaveFile={handleSaveFile}
                          isEditing={isEditing}
                          onToggleEditing={handleToggleEditMode}
                          onSaveRef={saveHandlerRef}
                        />
                      </article>
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
            <div className="pass-modal__title">Please enter password to edit</div>
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
            <div className="pass-modal__hint">Enter to verify · Esc to cancel</div>
          </div>
        </div>
      )}

      {namePrompt && (
        <div className="pass-overlay" onClick={() => { namePrompt.reject(new Error('cancelled')); setNamePrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">Enter the name for your new note</div>
            <input
              className="pass-modal__input"
              type="text"
              placeholder="Note name…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (!val) return;
                  namePrompt.resolve(val);
                  setNamePrompt(null);
                }
                if (e.key === 'Escape') {
                  namePrompt.reject(new Error('cancelled'));
                  setNamePrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter to create · Esc to cancel</div>
          </div>
        </div>
      )}

      {commentPrompt && (
        <div className="pass-overlay" onClick={() => { commentPrompt.reject(new Error('cancelled')); setCommentPrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">Add a comment to this note</div>
            <textarea
              className="pass-modal__input"
              style={{ minHeight: '100px', resize: 'vertical', paddingTop: '10px' }}
              placeholder="Your comment…"
              autoFocus
              defaultValue={commentPrompt.defaultValue}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const val = e.target.value.trim();
                  if (!val) return;
                  commentPrompt.resolve(val);
                  setCommentPrompt(null);
                }
                if (e.key === 'Escape') {
                  commentPrompt.reject(new Error('cancelled'));
                  setCommentPrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter to add · Shift+Enter for new line · Esc to cancel</div>
          </div>
        </div>
      )}

      <VaultStyles />
    </div>
  );
}
