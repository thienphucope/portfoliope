"use client";
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/common/Header';

export default function AudioVisualProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [animationClass, setAnimationClass] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  const playerRef = useRef(null);
  const bgPlayerRef = useRef(null);
  const newSongTimerRef = useRef(null);
  const bgPlayerDivRef = useRef(null);
  const musicPlayerDivRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initPlayers = () => {
      if (window.YT && window.YT.Player) {
        if (!bgPlayerRef.current && bgPlayerDivRef.current) {
          bgPlayerRef.current = new window.YT.Player(bgPlayerDivRef.current, {
            videoId: '305Uc8i5RJM',
            playerVars: {
              autoplay: 1, mute: 1, controls: 0, showinfo: 0, modestbranding: 1, rel: 0, iv_load_policy: 3, disablekb: 1, start: 50, end: 118,
            },
            events: {
              onReady: (e) => { e.target.mute(); if (e.target.setPlaybackQuality) e.target.setPlaybackQuality('small'); e.target.playVideo(); },
              onStateChange: (e) => { if (e.data === window.YT.PlayerState.ENDED) { e.target.seekTo(50); e.target.playVideo(); } },
            },
          });
        }
        if (!playerRef.current && musicPlayerDivRef.current) {
          playerRef.current = new window.YT.Player(musicPlayerDivRef.current, {
            height: '0', width: '0', videoId: 'aiKlW8XCABQ',
            playerVars: { autoplay: 1, loop: 1, playlist: 'aiKlW8XCABQ,6c5YHZhfxco', controls: 0, showinfo: 0, modestbranding: 1 },
            events: {
              onReady: (e) => { e.target.setVolume(50); e.target.playVideo(); },
              onStateChange: (e) => {
                if (e.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  const newTitle = e.target.getVideoData().title;
                  setVideoTitle(old => {
                    if (old !== newTitle) {
                      if (newSongTimerRef.current) clearTimeout(newSongTimerRef.current);
                      setAnimationClass('fly-cycle'); setAnimationKey(k => k + 1);
                      newSongTimerRef.current = setTimeout(() => setAnimationClass(''), 5500);
                    }
                    return newTitle;
                  });
                } else setIsPlaying(false);
              },
            },
          });
        }
      }
    };

    if (!window.YT || !window.YT.Player) {
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const oldReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (oldReady) oldReady();
        initPlayers();
      };
    } else {
      initPlayers();
    }

    const handleGlobalClick = () => { 
      if (playerRef.current?.playVideo) playerRef.current.playVideo(); 
      if (bgPlayerRef.current?.playVideo) bgPlayerRef.current.playVideo();
      window.removeEventListener('click', handleGlobalClick); 
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [mounted]);

  const togglePlayPause = () => {
    if (playerRef.current) {
      isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
      setIsPlaying(!isPlaying);
    }
  };

  const handleDiskMouseEnter = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-out'); setAnimationKey(k => k + 1);
  };
  const handleDiskMouseLeave = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-in'); setAnimationKey(k => k + 1);
  };

  return (
    <>
      <style jsx global>{`
        .video-background { position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; z-index: 0; pointer-events: none; overflow: hidden; background: black; }
        .video-background iframe { position: absolute; top: 50%; left: 50%; width: 100vw; height: 100dvh; transform: translate(-50%, -50%) scale(1.5); }
        @media (max-aspect-ratio: 16/9) { .video-background iframe { width: 177.78vh; height: 100dvh; } }
        @media (min-aspect-ratio: 16/9) { .video-background iframe { width: 100vw; height: 56.25vw; } }
        .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100dvh; z-index: 1; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); pointer-events: none; }
      `}</style>

      <div className="video-background">
        <div ref={bgPlayerDivRef}></div>
        <div className="video-overlay"></div>
      </div>

      <div className={`w-full relative z-10 transition-opacity duration-[2000ms] ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        
        <div style={{ display: 'none' }}>
          <div ref={musicPlayerDivRef}></div>
        </div>

        <Header 
          isPlaying={isPlaying} 
          videoTitle={videoTitle} 
          togglePlayPause={togglePlayPause}
          handleDiskMouseEnter={handleDiskMouseEnter}
          handleDiskMouseLeave={handleDiskMouseLeave}
          animationKey={animationKey}
          animationClass={animationClass}
        />

        {children}
      </div>
    </>
  );
}
