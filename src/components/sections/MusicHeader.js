// src/components/sections/MusicHeader.js
"use client";
import { useState, useEffect, useRef } from 'react';
import { SOCIAL_LINKS } from '@/configs/social';
import { FaGithub, FaDiscord, FaEnvelope } from 'react-icons/fa';
import { MUSIC_PLAYER } from '@/configs/media';

function MusicHeader({ onPlayStateChange, className = '', promptLabel = '', ariaLabel = 'Social links', showMusicControl = true } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
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
        playerVars: { autoplay: 0, loop: 1, playlist: MUSIC_PLAYER.videoId, controls: 0, showinfo: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { e.target.setVolume(MUSIC_PLAYER.volume); },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlayStateChange?.(true);
              const newTitle = e.target.getVideoData().title;
              setVideoTitle(old => {
                if (old !== newTitle) {
                  if (newSongTimerRef.current) clearTimeout(newSongTimerRef.current);
                  setAnimationClass('fly-cycle'); setAnimationKey(k => k + 1);
                  newSongTimerRef.current = setTimeout(() => setAnimationClass(''), 5500);
                }
                return newTitle;
              });
            } else {
              setIsPlaying(false);
              onPlayStateChange?.(false);
            }
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
  }, [mounted, onPlayStateChange]);

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
  };

  const handleDiskMouseEnter = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-out'); setAnimationKey(k => k + 1);
  };

  const handleDiskMouseLeave = () => {
    if (newSongTimerRef.current) { clearTimeout(newSongTimerRef.current); newSongTimerRef.current = null; }
    setAnimationClass('fly-in'); setAnimationKey(k => k + 1);
  };

  const socialLinks = [
    { href: SOCIAL_LINKS.github, label: 'GitHub', Icon: FaGithub },
    { href: SOCIAL_LINKS.discord, label: 'Discord', Icon: FaDiscord },
    { href: SOCIAL_LINKS.email, label: 'Email', Icon: FaEnvelope },
  ];
  const mastheadClassName = ['about-masthead', className].filter(Boolean).join(' ');

  return (
    <>
      <style jsx global>{`
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes flyOut { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 100% { opacity: 1; transform: translateY(-50%) translateX(40px); } }
        @keyframes flyIn { 0% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        @keyframes flyOutStayIn { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 9% { opacity: 1; transform: translateY(-50%) translateX(40px); } 91% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        .about-masthead {
          grid-area: masthead;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 0;
          padding-bottom: 4px;
        }
        .about-music-control {
          position: relative;
          flex: 0 0 auto;
          border: 0;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }
        .disk {
          display: block;
          position: relative;
          width: 48px;
          height: 48px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.34);
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%, #050505 0 3px, transparent 3.5px),
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--theme) 86%, #fff) 0 10px, color-mix(in srgb, var(--theme) 74%, #000) 10px 14px, transparent 14.5px),
            repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0 1px, rgba(255,255,255,0.03) 1px 2px, transparent 2px 4px),
            conic-gradient(from 20deg, rgba(255,255,255,0.18), transparent 18%, rgba(255,255,255,0.07) 30%, transparent 56%, rgba(255,255,255,0.14), transparent 82%),
            radial-gradient(circle at 50% 50%, #202020 0, #080808 62%, #000 100%);
          box-shadow:
            0 0 0 2px rgba(0,0,0,0.78),
            inset 0 0 0 1px rgba(255,255,255,0.08),
            inset 0 0 18px rgba(255,255,255,0.06),
            0 0 18px rgba(0,0,0,0.72);
          animation: rotate 10s linear infinite;
        }
        .disk::before {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: 50%;
          background: repeating-radial-gradient(circle at 50% 50%, transparent 0 4px, rgba(255,255,255,0.07) 4px 5px, transparent 5px 8px);
          opacity: 0.78;
        }
        .disk::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #030303;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.2),
            0 0 0 10px color-mix(in srgb, var(--theme) 24%, transparent),
            0 0 0 14px color-mix(in srgb, var(--theme) 82%, #000);
          transform: translate(-50%, -50%);
        }
        .disk.paused { animation-play-state: paused; }
        .title-fly-out { position: absolute; top: 50%; left: 50%; transform: translateY(-50%); color: var(--theme); font-size: 1rem; font-weight: bold; font-style: italic; white-space: nowrap; max-width: 42vw; overflow: hidden; text-overflow: ellipsis; opacity: 0; pointer-events: none; }
        .title-fly-out.fly-out { animation: flyOut 0.5s forwards; }
        .title-fly-out.fly-in { animation: flyIn 0.5s forwards; }
        .title-fly-out.fly-cycle { animation: flyOutStayIn 5.5s forwards; }
        .about-nav {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 16px;
          color: var(--theme);
        }
        .about-social-prompt {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-style: italic;
          letter-spacing: 0.08em;
          line-height: 1;
          color: currentColor;
          white-space: nowrap;
        }
        .about-social-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--theme);
          font-size: 1.35rem;
          line-height: 1;
          transition: color 0.25s ease, transform 0.25s ease;
        }
        .about-social-link:hover {
          color: #fff;
          transform: translateY(-2px);
        }

        @media (min-width: 768px) {
          .about-nav { gap: 22px; }
          .about-social-link { font-size: 1.6rem; }
        }
      `}</style>
      <div style={{ display: 'none' }}><div ref={musicPlayerDivRef}></div></div>
      <div className={mastheadClassName}>
        {showMusicControl && (
          <button type="button" className="about-music-control" aria-label={isPlaying ? 'Pause music' : 'Play music'} aria-pressed={isPlaying} onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
            <span className={`disk ${!isPlaying ? 'paused' : ''}`}></span>
            {videoTitle && <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`} style={{ fontFamily: 'var(--font-display)' }}>{videoTitle.length > 30 ? videoTitle.slice(0, 30).trimEnd() + '…' : videoTitle}</span>}
          </button>
        )}
        <nav className="about-nav" aria-label={ariaLabel}>
          {promptLabel && <span className="about-social-prompt">{promptLabel}</span>}
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="about-social-link"
              aria-label={label}
            >
              <Icon />
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}

export default MusicHeader;
