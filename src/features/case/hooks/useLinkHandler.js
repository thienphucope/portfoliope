import { useCallback } from 'react';
import { readCache } from '../utils/editor';

export function useLinkHandler({
  loadFile,
  createAndOpenFile,
  openFiles,
  tabs,
  applyFileContent,
  fileRegistry,
  setActiveTab,
  setActiveOverlay,
}) {
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
    if (setActiveOverlay) setActiveOverlay(null);
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

  return { resolveWikiPath, handleLinkClick };
}