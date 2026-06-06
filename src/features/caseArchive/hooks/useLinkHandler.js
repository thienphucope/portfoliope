import { useCallback } from 'react';

export function useLinkHandler({
  loadFile,
  tabs,
  fileRegistry,
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
    }
    // Link points to a note that does not exist → no-op in read-only mode.
  }, [loadFile, tabs, fileRegistry, setActiveOverlay]);

  return { resolveWikiPath, handleLinkClick };
}
