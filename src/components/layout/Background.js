"use client";
import { useEffect, useRef } from 'react';

export default function Background() {
  const bgPlayerRef = useRef(null);
  const bgPlayerDivRef = useRef(null);

  useEffect(() => {
    const initPlayer = () => {
      if (!window.YT?.Player || bgPlayerRef.current || !bgPlayerDivRef.current) return;
      bgPlayerRef.current = new window.YT.Player(bgPlayerDivRef.current, {
        videoId: '305Uc8i5RJM',
        playerVars: { autoplay: 1, mute: 1, controls: 0, showinfo: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, disablekb: 1, start: 50, end: 118 },
        events: {
          onReady: (e) => { e.target.mute(); if (e.target.setPlaybackQuality) e.target.setPlaybackQuality('small'); e.target.playVideo(); },
          onStateChange: (e) => { if (e.data === window.YT.PlayerState.ENDED) { e.target.seekTo(50); e.target.playVideo(); } },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); initPlayer(); };
    }

    const handleClick = () => { bgPlayerRef.current?.playVideo?.(); window.removeEventListener('click', handleClick); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <style jsx global>{`
        .video-background { position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; z-index: 0; pointer-events: none; overflow: hidden; background: black; }
        .video-background iframe { position: absolute; top: 50%; left: 50%; width: 100vw; height: 100dvh; transform: translate(-50%, -50%) scale(1.5); }
        @media (max-aspect-ratio: 16/9) { .video-background iframe { width: 177.78vh; height: 100dvh; } }
        @media (min-aspect-ratio: 16/9) { .video-background iframe { width: 100vw; height: 56.25vw; } }
        .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100dvh; z-index: 1; background: rgba(0,0,0,0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); pointer-events: none; }
      `}</style>
      <div className="video-background">
        <div ref={bgPlayerDivRef}></div>
        <div className="video-overlay"></div>
      </div>
    </>
  );
}
