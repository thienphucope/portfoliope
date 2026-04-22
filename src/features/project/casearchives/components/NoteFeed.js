import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BlockView } from './BlockEditor';
import { mkBlock } from '../utils/editor';
import { ensureLibsLoaded } from '../utils/markdown';
import { ExternalLink } from 'lucide-react';

const NoteFeedItem = React.forwardRef(({ block, onLinkClick, fileRegistry, style }, ref) => {
  const isQuote = block.type === 'blockquote';
  const isMedia = block.raw.trim().startsWith('!') || 
                  block.raw.toLowerCase().includes('<video') || 
                  block.raw.toLowerCase().includes('<audio') || 
                  block.raw.toLowerCase().includes('<iframe');
  
  const processContent = (raw) => {
    if (isMedia) return raw; 
    const isActuallyQuote = raw.trim().startsWith('>');
    const cleanText = isActuallyQuote ? raw.replace(/^>+/mg, '').trim() : raw;
    const words = cleanText.split(/\s+/);
    if (words.length > 50) {
      const truncated = words.slice(0, 50).join(' ') + '...';
      return isActuallyQuote ? `> ${truncated}` : truncated;
    }
    return raw;
  };

  const displayBlock = { ...block, raw: processContent(block.raw) };

  return (
    <div ref={ref} className="note-feed-item" style={{
      position: 'absolute',
      ...style,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      transition: 'transform 0.3s ease'
    }}>
      <div 
        onClick={(e) => {
          e.stopPropagation();
          const target = block.fileId || block.id;
          if (!target) return;
          const link = document.createElement('a');
          link.setAttribute('data-target', target);
          link.classList.add('internal-link');
          onLinkClick({ target: link, preventDefault: () => {} });
        }}
        style={{
          position: 'absolute',
          right: '-10px',
          top: '-10px',
          cursor: 'pointer',
          zIndex: 20,
          color: 'var(--colorone)',
          opacity: 0.4,
          padding: '10px',
          transition: 'all 0.2s ease'
        }}
        className="link-icon-hover"
        title={`View note: ${block.fileId}`}
      >
        <ExternalLink size={16} />
      </div>

      <div className="naked-block-content" style={{
        width: '100%',
        height: 'auto',
        color: 'var(--colorone)',
        fontSize: '1.2rem',
        fontStyle: isQuote ? 'italic' : 'normal',
        lineHeight: '1.4'
      }}>
        <BlockView
          block={displayBlock}
          isEditing={false}
          isActive={false}
          isReading={false}
          onActivate={() => {}}
          onLinkClick={onLinkClick}
          onDoubleClick={() => {}}
          fileRegistry={fileRegistry}
        />
      </div>
    </div>
  );
});

NoteFeedItem.displayName = 'NoteFeedItem';

export default function NoteFeed({
  allFiles,
  fileRegistry,
  fullContentCache,
  onLinkClick,
  reader,
  upsertCacheEntry
}) {
  const [displayedBlocks, setDisplayedBlocks] = useState([]);
  const [remainingFiles, setRemainingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const scrollRef = useRef(null);
  const containerRef = useRef(null);
  
  // Momentum scroll refs
  const scrollTarget = useRef(0);
  const isAnimating = useRef(false);

  useEffect(() => { 
    setIsMounted(true);
    ensureLibsLoaded().then(() => setLibsReady(true)); 
  }, []);

  useEffect(() => {
    if (allFiles.length > 0 && remainingFiles.length === 0 && displayedBlocks.length === 0) {
      const shuffled = [...allFiles].sort(() => Math.random() - 0.5);
      setRemainingFiles(shuffled);
    }
  }, [allFiles]);

  const generateBlockStyle = (index, type, raw) => {
    const isMedia = raw.trim().startsWith('!') || 
                    raw.toLowerCase().includes('<video') || 
                    raw.toLowerCase().includes('<audio') || 
                    raw.toLowerCase().includes('<iframe');
    
    const baseLeft = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const itemWidth = 750;
    const left = baseLeft + (index * itemWidth) + (Math.random() * 200);
    const topPercent = 40 + (Math.random() * 20); 
    
    if (isMedia) {
      return {
        left: `${left}px`,
        top: `${topPercent}%`,
        transform: `translateY(-50%)`,
        width: '500px',
        height: 'auto',
        minHeight: '100px'
      };
    } else {
      return {
        left: `${left}px`,
        top: `${topPercent}%`,
        transform: `translateY(-50%)`,
        width: 'auto',
        minWidth: '400px',
        maxWidth: '650px',
        height: 'auto',
        padding: '1rem',
        backgroundColor: 'transparent'
      };
    }
  };

  const startMomentum = useCallback(() => {
    if (isAnimating.current || !scrollRef.current) return;
    isAnimating.current = true;
    
    const animate = () => {
      const container = scrollRef.current;
      if (!container) {
        isAnimating.current = false;
        return;
      }
      const currentX = container.scrollLeft;
      const diff = scrollTarget.current - currentX;
      
      if (Math.abs(diff) < 0.5) {
        container.scrollLeft = scrollTarget.current;
        isAnimating.current = false;
      } else {
        container.scrollLeft = currentX + diff * 0.08;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || remainingFiles.length === 0 || !libsReady) return;
    setLoading(true);

    const nextBatch = remainingFiles.slice(0, 5);
    const newRemaining = remainingFiles.slice(5);

    const loadedBlocks = [];
    await Promise.all(nextBatch.map(async (file) => {
      let content = fullContentCache[file.id]?.raw;
      if (!content) {
        try {
          const githubUrl = fileRegistry[file.id.toLowerCase()] || fileRegistry[file.id.toLowerCase() + '.md'];
          if (!githubUrl) return;
          const res = await fetch(githubUrl);
          content = await res.text();
          upsertCacheEntry(file.id, content);
        } catch (e) { return; }
      }

      if (content) {
        const masterRegex = /(!\[.*?\]\(.*?\)|<audio[\s\S]*?<\/audio>|<video[\s\S]*?<\/video>|<iframe[\s\S]*?<\/iframe>|^>[\s\S]*?(?:\n\n|\n(?=[^>])|$))/gm;
        let match;
        while ((match = masterRegex.exec(content)) !== null) {
          const rawPart = match[0].trim();
          if (rawPart) {
            const isQuote = rawPart.startsWith('>');
            loadedBlocks.push({
              ...mkBlock(rawPart, isQuote ? 'blockquote' : 'paragraph'),
              fileId: file.id
            });
          }
        }
      }
    }));

    if (loadedBlocks.length > 0) {
      // Shuffling loaded blocks for extra randomness
      const shuffledBlocks = loadedBlocks.sort(() => Math.random() - 0.5);
      setDisplayedBlocks(prev => {
        const startIndex = prev.length;
        const newBlocksWithStyle = shuffledBlocks.map((b, i) => ({
          ...b,
          style: generateBlockStyle(startIndex + i, b.type, b.raw)
        }));
        return [...prev, ...newBlocksWithStyle];
      });
    }
    
    setRemainingFiles(newRemaining);
    setLoading(false);
  }, [remainingFiles, loading, fullContentCache, fileRegistry, upsertCacheEntry, libsReady]);

  useEffect(() => {
    if (remainingFiles.length > 0 && displayedBlocks.length === 0 && libsReady) {
      loadMore();
    }
  }, [remainingFiles, displayedBlocks, loadMore, libsReady]);

  useEffect(() => {
    if (isMounted && displayedBlocks.length > 0 && scrollRef.current) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollTarget.current = window.innerWidth;
          startMomentum();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [displayedBlocks.length > 0, isMounted, startMomentum]);

  const onScroll = useCallback((e) => {
    const element = e.target;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    if (scrollWidth - scrollLeft <= clientWidth + 2500) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.shiftKey) return; 
      e.preventDefault();
      
      if (!isAnimating.current) {
        scrollTarget.current = container.scrollLeft;
      }

      const maxScroll = container.scrollWidth - container.clientWidth;
      scrollTarget.current = Math.max(0, Math.min(scrollTarget.current + e.deltaY * 0.8, maxScroll));
      
      startMomentum();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', onScroll);
    };
  }, [onScroll, startMomentum]);

  const dynamicWidth = useMemo(() => {
    if (!isMounted) return 2000;
    const base = window.innerWidth;
    return base + (displayedBlocks.length * 800) + 3000;
  }, [displayedBlocks.length, isMounted]);

  if (!isMounted) return null;

  return (
    <div
      ref={scrollRef}
      className="note-feed-container"
      style={{
        position: 'fixed',
        inset: 0,
        overflowX: 'auto',
        overflowY: 'hidden',
        zIndex: 5,
        backgroundColor: '#161616',
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      <div 
        ref={containerRef}
        className="note-feed-content" 
        style={{
          height: '100%',
          minWidth: `${dynamicWidth}px`,
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20
        }}>
          <div
            onClick={() => {
              scrollTarget.current = containerRef.current.scrollLeft + window.innerWidth;
              startMomentum();
            }}
            className="intro-card"
            style={{
              backgroundColor: 'var(--colorone)',
              borderRadius: '999px',
              padding: '3rem 4rem',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
            <h1 className="intro-title" style={{
              fontSize: '4rem',
              fontWeight: '700',
              color: '#000',
              margin: 0,
              lineHeight: '1.2',
              whiteSpace: 'nowrap'
            }}>My Sightings</h1>
          </div>
        </div>

        {displayedBlocks.map((block, idx) => (
          <NoteFeedItem
            key={`${block.id}-${idx}`}
            block={block}
            onLinkClick={onLinkClick}
            fileRegistry={fileRegistry}
            reader={reader}
            style={block.style}
          />
        ))}

        {loading && (
          <div style={{ 
            position: 'absolute', 
            left: `${dynamicWidth - 1000}px`, 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: 'var(--accent)', 
            fontFamily: 'monospace',
            padding: '40px'
          }}>
            Loading archives...
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .note-feed-container {
          scrollbar-width: none;
        }
        .note-feed-container::-webkit-scrollbar {
          display: none;
        }
        .naked-block-content blockquote {
          margin: 0;
          padding: 0;
          border: none;
          background: transparent;
        }
        .naked-block-content p {
          margin: 0;
        }
        .intro-card {
          transform: scale(1);
        }
        .intro-card:hover {
          transform: scale(1.05);
        }
        .note-feed-item:hover .link-icon-hover {
          opacity: 1 !important;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
