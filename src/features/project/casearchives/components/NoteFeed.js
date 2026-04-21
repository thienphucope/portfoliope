import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BlockEditor from './BlockEditor';

const DISCUSSION_PHRASES = [
  'wanna discuss about this?',
  'same interest?',
  'lets talk about it',
  'thoughts?',
  'connect?'
];

const NoteFeedItem = ({ file, content, onLinkClick, fileRegistry, reader }) => {
  return (
    <div className="note-feed-item" style={{
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
};

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
  const scrollRef = useRef(null);

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

  const onScroll = useCallback((e) => {
    const element = e.target;
    const { scrollTop, scrollHeight, clientHeight } = element;
    if (scrollHeight - scrollTop <= clientHeight + 1000) {
      loadMore();
    }
  }, [loadMore]);

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
