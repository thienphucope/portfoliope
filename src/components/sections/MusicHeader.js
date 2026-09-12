// src/components/sections/MusicHeader.js
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { MUSIC_PLAYER } from '@/configs/media';

const TRACKS = MUSIC_PLAYER.tracks || [];
const DEFAULT_VOLUME = MUSIC_PLAYER.volume ?? 70;

function fmtTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function MusicHeader({ className = '' } = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [index, setIndex] = useState(0);
  const [played, setPlayed] = useState(0); // 0–1 fraction of current track
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME); // 0–100; 0 === muted
  const [mounted, setMounted] = useState(false);
  const playerRef = useRef(null);
  const musicPlayerDivRef = useRef(null);
  const lastVolumeRef = useRef(DEFAULT_VOLUME || 70);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !TRACKS.length) return;

    const initPlayer = () => {
      if (!window.YT?.Player || playerRef.current || !musicPlayerDivRef.current) return;
      playerRef.current = new window.YT.Player(musicPlayerDivRef.current, {
        height: '0', width: '0', videoId: TRACKS[0],
        playerVars: { autoplay: 0, controls: 0, showinfo: 0, modestbranding: 1 },
        events: {
          onReady: (e) => { e.target.setVolume(MUSIC_PLAYER.volume); },
          onStateChange: (e) => {
            const YT = window.YT.PlayerState;
            if (e.data === YT.PLAYING) {
              setIsPlaying(true);
              setVideoTitle(e.target.getVideoData().title);
            } else if (e.data === YT.ENDED) {
              setPlayed(0);
              setIndex((i) => {
                const next = (i + 1) % TRACKS.length;
                playerRef.current?.loadVideoById(TRACKS[next]);
                return next;
              });
            } else {
              setIsPlaying(false);
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
  }, [mounted]);

  // YouTube has no timeupdate event → poll while playing.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const p = playerRef.current;
      const d = p?.getDuration?.() || 0;
      const t = p?.getCurrentTime?.() || 0;
      setDuration(d);
      setElapsed(t);
      setPlayed(d ? t / d : 0);
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  const seek = useCallback((fraction) => {
    const p = playerRef.current;
    const d = p?.getDuration?.() || 0;
    if (!d) return;
    p.seekTo(d * fraction, true);
    setPlayed(fraction);
  }, []);

  const applyVolume = useCallback((v) => {
    playerRef.current?.setVolume?.(v);
    setVolume(v);
    if (v > 0) lastVolumeRef.current = v;
  }, []);

  const toggleMute = useCallback(() => {
    applyVolume(volume > 0 ? 0 : lastVolumeRef.current || 70);
  }, [volume, applyVolume]);

  const togglePlayPause = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    isPlaying ? p.pauseVideo() : p.playVideo();
  }, [isPlaying]);

  const skip = useCallback((dir) => {
    const p = playerRef.current;
    if (!p || TRACKS.length < 2) return;
    setPlayed(0);
    setIndex((i) => {
      const next = (i + dir + TRACKS.length) % TRACKS.length;
      p.loadVideoById(TRACKS[next]);
      p.playVideo();
      return next;
    });
  }, []);

  const nowPlaying = videoTitle
    ? (videoTitle.length > 42 ? videoTitle.slice(0, 42).trimEnd() + '…' : videoTitle)
    : 'Nothing playing';
  const single = TRACKS.length < 2;

  return (
    <div className={['music-player', className].filter(Boolean).join(' ')}>
      <style jsx global>{`
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .music-player { display: flex; align-items: center; gap: 15px; }
        .mp-disc { flex: 0 0 auto; border: 0; padding: 0; background: transparent; cursor: pointer; line-height: 0; }
        .disk {
          display: block;
          position: relative;
          width: 52px;
          height: 52px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.28);
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 15%, #fff 0 1.7px, rgba(255,255,255,0.5) 1.7px 2.5px, transparent 2.9px),
            radial-gradient(circle at 50% 50%, #050505 0 3px, transparent 3.5px),
            radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--theme) 86%, #fff) 0 11px, color-mix(in srgb, var(--theme) 74%, #000) 11px 15px, transparent 15.5px),
            repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0 1px, rgba(255,255,255,0.03) 1px 2px, transparent 2px 4px),
            conic-gradient(from 20deg, rgba(255,255,255,0.18), transparent 18%, rgba(255,255,255,0.07) 30%, transparent 56%, rgba(255,255,255,0.14), transparent 82%),
            radial-gradient(circle at 50% 50%, #202020 0, #080808 62%, #000 100%);
          box-shadow: 0 0 0 2px rgba(0,0,0,0.5), inset 0 0 12px rgba(255,255,255,0.05);
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
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #030303;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.2), 0 0 0 10px color-mix(in srgb, var(--theme) 22%, transparent), 0 0 0 13px color-mix(in srgb, var(--theme) 78%, #000);
          transform: translate(-50%, -50%);
        }
        .disk.paused { animation-play-state: paused; }
        .mp-meta { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .mp-topline { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
        .mp-title {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-style: italic;
          line-height: 1.2;
          color: var(--archive-ink);
        }
        .mp-title.idle { color: var(--archive-muted); }
        .mp-time { flex: 0 0 auto; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.06em; color: var(--archive-muted); font-variant-numeric: tabular-nums; }
        .mp-seek {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          margin: 0;
          cursor: pointer;
          background: linear-gradient(to right, var(--archive-ink) var(--played, 0%), var(--archive-line) var(--played, 0%));
        }
        .mp-seek::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border: 0;
          border-radius: 50%;
          background: var(--archive-ink);
        }
        .mp-seek::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border: 0;
          border-radius: 50%;
          background: var(--archive-ink);
        }
        .mp-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 10px 14px; color: var(--archive-muted); }
        .mp-volume { display: flex; align-items: center; gap: 8px; }
        .mp-vol { width: 54px; flex: 0 0 54px; }
        .mp-btn { display: grid; place-items: center; border: 0; padding: 0; background: transparent; color: inherit; cursor: pointer; transition: color 0.18s; }
        .mp-btn:hover:not(:disabled) { color: var(--archive-ink); }
        .mp-btn:disabled { opacity: 0.35; cursor: default; }
        .mp-play { color: var(--archive-ink); }
        .mp-index { margin-left: auto; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.08em; color: var(--archive-muted); }
      `}</style>
      <div style={{ display: 'none' }}><div ref={musicPlayerDivRef}></div></div>

      <button type="button" className="mp-disc" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'} aria-pressed={isPlaying}>
        <span className={`disk ${!isPlaying ? 'paused' : ''}`}></span>
      </button>

      <div className="mp-meta">
        <div className="mp-topline">
          <span className={`mp-title${isPlaying ? '' : ' idle'}`} title={videoTitle || undefined}>{nowPlaying}</span>
          <span className="mp-time">{fmtTime(elapsed)} / {fmtTime(duration)}</span>
        </div>
        <input
          type="range"
          className="mp-seek"
          min="0"
          max="1"
          step="0.001"
          value={played}
          onChange={(e) => seek(Number(e.target.value))}
          style={{ '--played': `${played * 100}%` }}
          aria-label="Seek"
        />
        <div className="mp-controls">
          <button type="button" className="mp-btn" onClick={() => skip(-1)} disabled={single} aria-label="Previous track"><SkipBack size={16} strokeWidth={1.6} /></button>
          <button type="button" className="mp-btn mp-play" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>{isPlaying ? <Pause size={17} strokeWidth={1.6} /> : <Play size={17} strokeWidth={1.6} />}</button>
          <button type="button" className="mp-btn" onClick={() => skip(1)} disabled={single} aria-label="Next track"><SkipForward size={16} strokeWidth={1.6} /></button>
          <div className="mp-volume">
            <button type="button" className="mp-btn" onClick={toggleMute} aria-label={volume === 0 ? 'Unmute' : 'Mute'} aria-pressed={volume === 0}>
              {volume === 0 ? <VolumeX size={16} strokeWidth={1.6} /> : <Volume2 size={16} strokeWidth={1.6} />}
            </button>
            <input
              type="range"
              className="mp-seek mp-vol"
              min="0"
              max="100"
              step="1"
              value={volume}
              onChange={(e) => applyVolume(Number(e.target.value))}
              style={{ '--played': `${volume}%` }}
              aria-label="Volume"
            />
          </div>
          <span className="mp-index">{String(index + 1).padStart(2, '0')} / {String(TRACKS.length).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}

export default MusicHeader;
