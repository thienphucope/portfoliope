"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MUSIC_PLAYER } from '@/configs/media';

export default function Header() {
  const pathname = usePathname();
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [animationClass, setAnimationClass] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef(null);
  const newSongTimerRef = useRef(null);
  const musicPlayerDivRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const initPlayer = () => {
      if (!window.YT?.Player || playerRef.current || !musicPlayerDivRef.current) return;
      playerRef.current = new window.YT.Player(musicPlayerDivRef.current, {
        height: '0', width: '0', videoId: MUSIC_PLAYER.videoId,
        playerVars: { autoplay: 1, loop: 1, playlist: MUSIC_PLAYER.videoId, controls: 0, showinfo: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { e.target.setVolume(MUSIC_PLAYER.volume); e.target.playVideo(); },
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
            } else { setIsPlaying(false); }
          },
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

    const handleClick = () => { playerRef.current?.playVideo?.(); window.removeEventListener('click', handleClick); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [mounted]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    setIsPlaying(!isPlaying);
  };

  const handleDiskMouseEnter = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-out'); setAnimationKey(k => k + 1);
  };

  const handleDiskMouseLeave = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-in'); setAnimationKey(k => k + 1);
  };

  const navLinks = [
    { href: '/about', label: 'about' },
    { href: '/privacy', label: 'privacy' },
    { href: '/terms', label: 'terms' },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes flyOut { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 100% { opacity: 1; transform: translateY(-50%) translateX(40px); } }
        @keyframes flyIn { 0% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        @keyframes flyOutStayIn { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 9% { opacity: 1; transform: translateY(-50%) translateX(40px); } 91% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        .disk { width: 48px; height: 48px; border: 2px solid var(--theme); border-radius: 50%; background-image: url('${MUSIC_PLAYER.diskImage}'); background-size: cover; background-position: center; animation: rotate 10s linear infinite; }
        .disk.paused { animation-play-state: paused; }
        .title-fly-out { position: absolute; top: 50%; left: 50%; transform: translateY(-50%); color: var(--theme); font-size: 1rem; font-weight: bold; font-style: italic; white-space: nowrap; opacity: 0; pointer-events: none; }
        .title-fly-out.fly-out { animation: flyOut 0.5s forwards; }
        .title-fly-out.fly-in { animation: flyIn 0.5s forwards; }
        .title-fly-out.fly-cycle { animation: flyOutStayIn 5.5s forwards; }
      `}</style>
      <div style={{ display: 'none' }}><div ref={musicPlayerDivRef}></div></div>
      <header className="fixed top-0 left-0 right-0 px-2 md:px-4 py-2 md:py-4 flex justify-between items-center z-[101] transition-opacity duration-1000 opacity-100">
        <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
          <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
          {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`} style={{ fontFamily: 'var(--font-display)' }}>{videoTitle}</span>}
        </div>
        <nav className="flex items-center gap-4 md:gap-6 text-[var(--theme)]" style={{ fontFamily: 'var(--font-display)' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg md:text-xl font-bold transition-colors duration-300 ${isActive ? 'line-through' : 'hover:text-white'}`}
                style={isActive ? { color: 'var(--theme)', textDecorationThickness: '4px', textDecorationColor: 'white' } : {}}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
