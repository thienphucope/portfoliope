import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BlockEditor from './BlockEditor';

const DISCUSSION_PHRASES = [
  'wanna discuss about this?',
  'same interest?',
  'lets talk about it',
  'thoughts?',
  'connect?'
];

const NoteFeedItem = React.forwardRef(({ file, content, onLinkClick, fileRegistry, reader }, ref) => {
  return (
    <div ref={ref} className="note-feed-item" style={{
      marginBottom: '8rem',
      width: '100%',
      maxWidth: '550px',
      margin: '0 auto 8rem auto',
      background: 'transparent',
    }}>
      <BlockEditor
        content={content}
        fileName={file.id}
        onLinkClick={onLinkClick}
        readOnly={true}
        isEditing={false}
        fileRegistry={fileRegistry}
        reader={reader}
        onSaveFile={() => {}}
      />
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
  const [displayedFiles, setDisplayedFiles] = useState([]);
  const [remainingFiles, setRemainingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showBookmark, setShowBookmark] = useState(false);
  const scrollRef = useRef(null);
  const fileRefs = useRef({});

  // Initialize remaining files and shuffle them
  useEffect(() => {
    if (allFiles.length > 0 && remainingFiles.length === 0 && displayedFiles.length === 0) {
      const shuffled = [...allFiles].sort(() => Math.random() - 0.5);
      setRemainingFiles(shuffled);
    }
  }, [allFiles]);

  const loadMore = useCallback(async () => {
    if (loading || remainingFiles.length === 0) return;
    setLoading(true);

    const nextBatch = remainingFiles.slice(0, 3);
    const newRemaining = remainingFiles.slice(3);

    // Fetch content for next batch if not in cache
    const loadedBatch = await Promise.all(nextBatch.map(async (file) => {
      if (fullContentCache[file.id]?.raw) {
        return { ...file, content: fullContentCache[file.id].raw };
      }
      try {
        const githubUrl = fileRegistry[file.id.toLowerCase()] || fileRegistry[file.id.toLowerCase() + '.md'];
        if (!githubUrl) return null;
        
        const res = await fetch(githubUrl);
        const text = await res.text();
        upsertCacheEntry(file.id, text);
        return { ...file, content: text };
      } catch (e) {
        console.error('Failed to load file for feed:', file.id, e);
        return null;
      }
    }));

    const validBatch = loadedBatch.filter(Boolean);
    setDisplayedFiles(prev => [...prev, ...validBatch]);
    setRemainingFiles(newRemaining);
    setLoading(false);
  }, [remainingFiles, loading, fullContentCache, fileRegistry, upsertCacheEntry]);

  // Initial load
  useEffect(() => {
    if (remainingFiles.length > 0 && displayedFiles.length === 0) {
      loadMore();
    }
  }, [remainingFiles, displayedFiles, loadMore]);

  const allFilesInOrder = useMemo(() => [...displayedFiles, ...remainingFiles], [displayedFiles, remainingFiles]);

  const pendingScrollTarget = useRef(null);

  // After each load, check if pending scroll target is now available
  useEffect(() => {
    const targetId = pendingScrollTarget.current;
    if (!targetId) return;
    const ref = fileRefs.current[targetId];
    if (ref && scrollRef.current) {
      // Found - scroll to it
      pendingScrollTarget.current = null;
      setTimeout(() => {
        const r = fileRefs.current[targetId];
        if (r && scrollRef.current) {
          const rect = r.getBoundingClientRect();
          scrollRef.current.scrollBy({ top: rect.top - 16, behavior: 'smooth' });
        }
      }, 50);
    } else if (!loading) {
      // Not loaded yet - keep loading
      loadMore();
    }
  }, [displayedFiles, loading, loadMore]);

  const onScroll = useCallback((e) => {
    const element = e.target;
    const { scrollTop, scrollHeight, clientHeight } = element;
    if (scrollHeight - scrollTop <= clientHeight + 1000) {
      loadMore();
    }

    // Show bookmark once user scrolls past intro
    if (scrollTop > clientHeight * 0.8) {
      setShowBookmark(true);
    }

    // Track current file: last note whose top is above viewport top
    let found = 0;
    for (let i = 0; i < displayedFiles.length; i++) {
      const ref = fileRefs.current[displayedFiles[i].id];
      if (ref) {
        const top = ref.getBoundingClientRect().top;
        if (top <= 80) found = i;
        else break;
      }
    }
    setCurrentFileIndex(found);
  }, [loadMore, displayedFiles]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  return (
    <div
      ref={scrollRef}
      className="note-feed-container"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 5,
        padding: '16px 16px 60px 16px',
        backgroundColor: '#161616',
        height: '100dvh',
        width: '100vw'
      }}
    >
      {showBookmark && displayedFiles.length > 0 && (() => {
        const startIdx = Math.max(0, currentFileIndex - 2);
        const visibleFiles = allFilesInOrder.slice(startIdx, currentFileIndex + 3);
        const posInSlice = currentFileIndex - startIdx;
        return (
          <div className="bookmark-wheel" style={{
            position: 'fixed',
            left: 'calc((100vw - 550px) / 4)',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'none',
            alignItems: 'flex-start'
          }}>
            {visibleFiles.map((file, idx) => {
              const isCurrentFile = idx === posInSlice;
              const isLoaded = !!fileRefs.current[file.id];
              return (
                <div
                  key={file.id}
                  onClick={() => {
                    if (!scrollRef.current) return;
                    if (isLoaded) {
                      const ref = fileRefs.current[file.id];
                      const rect = ref.getBoundingClientRect();
                      scrollRef.current.scrollBy({ top: rect.top - 16, behavior: 'smooth' });
                    } else {
                      pendingScrollTarget.current = file.id;
                      loadMore();
                    }
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '4px 0',
                    whiteSpace: 'nowrap',
                    fontWeight: isCurrentFile ? '600' : '400',
                    color: 'var(--colorone)',
                    transition: 'all 0.3s ease',
                    cursor: isLoaded ? 'pointer' : 'default',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    opacity: isCurrentFile ? 1 : 0.5
                  }}
                  title={file.id}
                >
                  {file.id.split('/').pop().replace(/\.md$/, '')}
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="note-feed-content" style={{
        maxWidth: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          height: '100dvh',
          width: '100%',
          maxWidth: '550px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div
            onClick={() => {
              scrollRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
            }}
            className="intro-card"
            style={{
              backgroundColor: 'var(--colorone)',
              borderRadius: '999px',
              padding: '2rem 2.5rem',
              cursor: 'pointer',
              textAlign: 'center',
              width: '100%',
              transition: 'all 0.3s ease'
            }}>
            <h1 className="intro-title" style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#000',
              margin: 0,
              lineHeight: '1.2'
            }}>Understand me?</h1>
          </div>
        </div>
        {displayedFiles.map((file, idx) => (
          <React.Fragment key={`${file.id}-${idx}`}>
            <NoteFeedItem
              ref={(el) => {
                if (el) fileRefs.current[file.id] = el;
              }}
              file={file}
              content={file.content}
              onLinkClick={onLinkClick}
              fileRegistry={fileRegistry}
              reader={reader}
            />
            <a
              href="mailto:thienphucmain1052004@gmail.com"
              style={{
                color: '#000',
                background: 'var(--colorbutton, #FFFACD)',
                textDecoration: 'none',
                fontSize: '14px',
                fontStyle: 'italic',
                fontWeight: '500',
                padding: '8px 16px',
                textAlign: 'center',
                display: 'inline-block',
                marginBottom: '10rem',
                borderRadius: '16px'
              }}
            >
              {DISCUSSION_PHRASES[Math.floor(Math.random() * DISCUSSION_PHRASES.length)]}
            </a>
          </React.Fragment>
        ))}
        {loading && <div className="feed-loading" style={{ color: 'var(--accent)', padding: '20px', fontFamily: 'monospace' }}>Loading archives...</div>}
      </div>
      
      <style jsx>{`
        .note-feed-container {
          scrollbar-width: none;
        }
        .note-feed-container::-webkit-scrollbar {
          display: none;
        }
        .bookmark-wheel {
          display: flex;
        }
        @media (max-width: 768px) {
          .bookmark-wheel {
            display: none !important;
          }
        }
        .intro-card {
          transform: translateY(0) scale(1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .intro-card:hover {
          transform: translateY(-0.5rem) scale(1.02);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }
        .intro-title {
          white-space: nowrap;
        }
        @media (max-width: 480px) {
          .intro-title {
            font-size: 1.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
