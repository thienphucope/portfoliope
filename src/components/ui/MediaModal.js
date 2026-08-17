"use client";
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPlay } from 'react-icons/fa';

const MediaModalContext = createContext(null);

export function useMediaModal() {
  return useContext(MediaModalContext);
}

export function MediaModalProvider({ children }) {
  const [media, setMedia] = useState(null);

  const openMedia = useCallback((config) => setMedia(config), []);
  const close = useCallback(() => setMedia(null), []);

  useEffect(() => {
    if (!media) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [media, close]);

  return (
    <MediaModalContext.Provider value={openMedia}>
      {children}
      {media && (
        <div className="media-modal-backdrop" onClick={close}>
          <div className={`media-modal ${media.type === 'image' ? 'media-modal--image' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="media-modal-close" aria-label="Close" onClick={close}><FaTimes /></button>
            {media.type === 'youtube' && (
              <iframe
                src={`https://www.youtube.com/embed/${media.videoId}?autoplay=1${media.start ? `&start=${media.start}` : ''}`}
                title={media.title || 'Video'}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
            {media.type === 'image' && (
              <img src={media.src} alt={media.alt || ''} />
            )}
          </div>
        </div>
      )}
    </MediaModalContext.Provider>
  );
}

export function MediaThumb({ type, videoId, src, alt, start, title, className, children }) {
  const openMedia = useMediaModal();

  const handleClick = () => {
    if (type === 'youtube') openMedia({ type: 'youtube', videoId, start, title });
    else if (type === 'image') openMedia({ type: 'image', src, alt });
  };

  if (children) {
    return <button type="button" className={className} onClick={handleClick}>{children}</button>;
  }

  if (type === 'youtube') {
    return (
      <button type="button" className={`media-thumb media-thumb--video ${className || ''}`} onClick={handleClick}>
        <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} alt={title || 'Video thumbnail'} />
        <span className="media-thumb-play"><FaPlay /></span>
      </button>
    );
  }

  return (
    <button type="button" className={`media-thumb ${className || ''}`} onClick={handleClick}>
      <img src={src} alt={alt || ''} />
    </button>
  );
}
