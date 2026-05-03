import { useState, useRef, useCallback } from 'react';

/**
 * Manages the file tree state and the in-memory registry
 * that maps normalized paths/names → GitHub raw URLs.
 */
export function useFileRegistry() {
  const [fileTree, setFileTree] = useState([]);
  const fileRegistry   = useRef({});   // lowercased-path → github raw URL (or null for local-new)
  const serverRawCache = useRef({});   // repoKey → last-known raw markdown string

  /** Rebuild registry from a raw tree array fetched from /api/cases */
  const buildRegistry = useCallback((rawTree) => {
    const newRegistry    = {};
    const repoPathMap    = {}; // normalized → canonical repoPath string

    const walk = (nodes, repoPath = '') => {
      nodes.forEach((n) => {
        if (n.kind === 'file') {
          const fullRepoPath  = repoPath ? `${repoPath}/${n.name}` : n.name;
          const lowerFull     = fullRepoPath.toLowerCase();
          const lowerName     = n.name.toLowerCase();
          const lowerNoExt    = n.name.replace('.md', '').toLowerCase();

          newRegistry[lowerFull]  = n.path;
          newRegistry[lowerName]  = n.path;
          newRegistry[lowerNoExt] = n.path;

          repoPathMap[lowerFull]  = fullRepoPath;
          repoPathMap[lowerName]  = fullRepoPath;
          repoPathMap[lowerNoExt] = fullRepoPath;
        } else if (n.children) {
          walk(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
        }
      });
    };

    walk(rawTree);
    fileRegistry.current = newRegistry;
    return repoPathMap;
  }, []);

  /** Fetch the tree from the API, rebuild registry, update state */
  const refreshTree = useCallback(async () => {
    try {
      const tree = await fetch('/api/cases', { cache: 'no-store' }).then((r) => r.json());
      if (!Array.isArray(tree)) return null;
      const repoPathMap = buildRegistry(tree);
      setFileTree(tree);
      return repoPathMap;
    } catch (e) {
      console.error('Failed to refresh tree:', e);
      return null;
    }
  }, [buildRegistry]);

  /** Register a brand-new local (unsaved) file into the registry */
  const registerLocalFile = useCallback((serverPath, displayName, target) => {
    fileRegistry.current[serverPath.toLowerCase()] = null;
    fileRegistry.current[displayName.toLowerCase()] = null;
    fileRegistry.current[target.toLowerCase()] = null;
  }, []);

  /** Insert a new file node into the tree without a server round-trip */
  const insertFileIntoTree = useCallback((serverPath) => {
    const parts = serverPath.split('/');
    setFileTree((prev) => {
      const insert = (nodes, [head, ...rest]) => {
        if (rest.length === 0) {
          if (nodes.some((n) => n.name.toLowerCase() === head.toLowerCase())) return nodes;
          return [...nodes, { kind: 'file', name: head, path: null, isLocal: true }];
        }
        const folder = nodes.find(
          (n) => n.kind === 'directory' && n.name.toLowerCase() === head.toLowerCase()
        );
        if (folder) {
          return nodes.map((n) =>
            n === folder ? { ...n, children: insert(n.children || [], rest) } : n
          );
        }
        return [...nodes, { kind: 'directory', name: head, isOpen: true, children: insert([], rest) }];
      };
      return insert(prev, parts);
    });
  }, []);

  return {
    fileTree,
    setFileTree,
    fileRegistry,
    serverRawCache,
    buildRegistry,
    refreshTree,
    registerLocalFile,
    insertFileIntoTree,
  };
}
