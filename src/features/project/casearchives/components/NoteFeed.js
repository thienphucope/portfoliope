import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BlockEditor from './BlockEditor';

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
        {displayedFiles.map((file, idx) => (
          <NoteFeedItem 
            key={`${file.id}-${idx}`}
            file={file}
            content={file.content}
            onLinkClick={onLinkClick}
            fileRegistry={fileRegistry}
            reader={reader}
          />
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
      `}</style>
    </div>
  );
}
