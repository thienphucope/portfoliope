import { useState, useRef, useCallback } from 'react';

/**
 * Manages the file tree state and the in-memory registry
 * that maps normalized paths/names → GitHub raw URLs.
 */
export function useFileRegistry() {
  const [fileTree, setFileTree] = useState([]);
  const fileRegistry   = useRef({});   // lowercased-path → github raw URL
  const serverRawCache = useRef({});   // repoKey → last-known raw markdown string

  /** Rebuild registry from a raw tree array */
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

  return {
    fileTree,
    setFileTree,
    fileRegistry,
    serverRawCache,
    buildRegistry,
  };
}
