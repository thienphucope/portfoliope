"use client";
import Hero from './components/Hero';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FaYoutube, FaInstagram, FaGithub, FaEnvelope, FaTwitter } from 'react-icons/fa';
import { Fingerprint } from 'lucide-react';

const GLITCH_FONTS = [
  "'Courier New', monospace",
  "fantasy",
  "cursive",
  "'Impact', sans-serif",
  "'Georgia', serif",
  "'Palatino', serif",
  "monospace",
  "'Times New Roman', serif",
];

function CaseArchivesCanvas() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef("idle");
  const phaseTimeRef = useRef(0);
  const fontIndexRef = useRef(0);
  const glitchSeedRef = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const SIZE = 30;
    const TEXT = "Case Archives";

    const getColor = () =>
      (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue("--colorone").trim()) || "#e879a0";

    ctx.font = `bold ${SIZE}px 'Fredericka the Great', serif`;
    canvas.width = Math.ceil(ctx.measureText(TEXT).width) + 20;
    canvas.height = SIZE + 16;

    const draw = (font, glitch = false) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `bold ${SIZE}px ${font}`;
      ctx.textBaseline = "middle";
      const tw = ctx.measureText(TEXT).width;
      const x = (canvas.width - tw) / 2;
      const y = canvas.height / 2;
      const color = getColor();

      if (glitch) {
        const slices = 4;
        for (let i = 0; i < slices; i++) {
          const ox = (Math.random() - 0.5) * 16;
          const oy = (Math.random() - 0.5) * 5;
          const sh = canvas.height / slices;
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, i * sh, canvas.width, sh);
          ctx.clip();
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#ff003c";
          ctx.fillText(TEXT, x + ox + 3, y + oy);
          ctx.fillStyle = "#00fff9";
          ctx.fillText(TEXT, x + ox - 3, y + oy);
          ctx.globalAlpha = 1;
          ctx.fillStyle = color;
          ctx.fillText(TEXT, x + ox, y + oy);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = color;
        ctx.fillText(TEXT, x, y);
      }
    };

    draw("'Fredericka the Great', serif");
    phaseRef.current = "glitch";

    let last = 0;
    const loop = (ts) => {
      const dt = ts - last; last = ts;
      const phase = phaseRef.current;

      if (phase === "idle") {
        draw("'Fredericka the Great', serif");
        phaseTimeRef.current += dt;
        if (phaseTimeRef.current > 2000) {
          phaseRef.current = "glitch";
          phaseTimeRef.current = 0;
        }
      } else if (phase === "glitch" || phase === "glitch2") {
        phaseTimeRef.current += dt;
        if (Math.floor(ts / 40) !== glitchSeedRef.current) {
          glitchSeedRef.current = Math.floor(ts / 40);
          draw("'Fredericka the Great', serif", true);
        }
        if (phaseTimeRef.current > 350) {
          phaseRef.current = phase === "glitch" ? "fontcycle" : "idle";
          phaseTimeRef.current = 0;
          fontIndexRef.current = 0;
        }
      } else if (phase === "fontcycle") {
        phaseTimeRef.current += dt;
        draw(GLITCH_FONTS[fontIndexRef.current % GLITCH_FONTS.length]);
        if (phaseTimeRef.current > 160) {
          phaseTimeRef.current = 0;
          fontIndexRef.current++;
          if (fontIndexRef.current >= GLITCH_FONTS.length) {
            phaseRef.current = "glitch2";
            phaseTimeRef.current = 0;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <Link href="/case">
      <canvas
        ref={canvasRef}
        className="w-[120px] md:w-auto h-auto cursor-pointer"
        style={{ display: "inline-block", verticalAlign: "middle" }}
      />
    </Link>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isIntroStarted, setIsIntroStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoTitle, setVideoTitle] = useState('');
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const [apiUsername, setApiUsername] = useState('YOU');
  const [fingerprints, setFingerprints] = useState([]);

  const DEFAULT_STORY_TEXT = "Dear Ope Watson!\n\nToday, I've seen a ghost hanging behind the room's door. Can you explain that?";
  const [storyText, setStoryText] = useState(DEFAULT_STORY_TEXT);

  const scrollRef = useRef(null);
  const snowRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const playerRef = useRef(null);
  const bgPlayerRef = useRef(null);
  const newSongTimerRef = useRef(null);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const id = Date.now();
      setFingerprints(prev => [...prev, { id, x: e.clientX, y: e.clientY, rotation: Math.random() * 360 }]);
      setTimeout(() => {
        setFingerprints(prev => prev.filter(fp => fp.id !== id));
      }, 5000);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        const ipFormatted = data.ip.replace(/\./g, '-');
        const userAgent = navigator.userAgent;
        let device = userAgent.includes('Mobile') ? 'Mobile' : userAgent.includes('Windows') ? 'Windows' : 'Device';
        setApiUsername(`${device}-${ipFormatted}`);
      })
      .catch(() => setApiUsername("User"));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    if (spotlightEnabled) window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [spotlightEnabled]);

  const updateSnow = useCallback(() => {
    const scrollContainer = scrollRef.current;
    const snowContainer = snowRef.current;
    if (scrollContainer && snowContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      snowContainer.style.height = `${scrollHeight}px`;
      snowContainer.style.setProperty('--page-height', `${scrollHeight}px`);
      const flakes = snowContainer.querySelectorAll('.snowflake');
      const numScreens = scrollHeight / (window.innerHeight || 1);
      flakes.forEach((flake) => {
        const startTop = Math.random() * -scrollHeight;
        flake.style.top = `${startTop}px`;
        const baseFallDuration = Math.random() * 1 + 1;
        const fallDuration = baseFallDuration * numScreens;
        flake.style.setProperty('--fall-duration', `${fallDuration}s`);
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      updateSnow();
      window.addEventListener('resize', updateSnow);
      return () => window.removeEventListener('resize', updateSnow);
    }
  }, [mounted, updateSnow]);

  useEffect(() => {
    const initPlayers = () => {
      // Background Video Player
      if (window.YT && window.YT.Player && !bgPlayerRef.current) {
        bgPlayerRef.current = new window.YT.Player('bg-player', {
          videoId: '305Uc8i5RJM',
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            disablekb: 1,
            start: 48,
            end: 120,
          },
          events: {
            onReady: (e) => {
              e.target.mute();
              e.target.playVideo();
            },
            onStateChange: (e) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                e.target.seekTo(37);
                e.target.playVideo();
              }
            },
          },
        });
      }

      // Music Player
      if (isIntroStarted && window.YT && window.YT.Player && !playerRef.current) {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '0', width: '0', videoId: '8itIwVBu6os',
          playerVars: { autoplay: 1, loop: 1, playlist: 'JEUf8nTl5aU,pL35m337Qa4', controls: 0, showinfo: 0, modestbranding: 1 },
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
    };

    if (!window.YT || !window.YT.Player) {
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api";
        const first = document.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(tag, first);
      }
      window.onYouTubeIframeAPIReady = initPlayers;
    } else {
      initPlayers();
    }
    const handleGlobalClick = () => { 
      if (playerRef.current?.playVideo) playerRef.current.playVideo(); 
      if (bgPlayerRef.current?.playVideo) bgPlayerRef.current.playVideo();
      window.removeEventListener('click', handleGlobalClick); 
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [isIntroStarted]);

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

  const handleStorySubmit = async () => {
    try {
      await fetch("https://rag-backend-zh2e.onrender.com/rag", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: apiUsername, query: "@dm " + storyText.trim() }),
      });
    } catch (e) { console.error(e); }
    setIsStoryOpen(false); setStoryText(DEFAULT_STORY_TEXT);
  };

  const snowflakeCount = 50;
  const snowflakes = useMemo(() => {
    return Array.from({ length: snowflakeCount }).map((_, i) => {
      const randomImage = Math.floor(Math.random() * 3) + 1;
      const size = Math.random() * 10 + 100;
      const rotationDuration = Math.random() * 2 + 2;
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const initialLeft = Math.random() * 150;
      return <div key={i} className="snowflake" style={{
        left: `${initialLeft}vw`, opacity: Math.random() * 0.5 + 0.5,
        '--base-left': `${initialLeft}vw`, '--rotation-duration': `${rotationDuration}s`,
        '--rotation-direction': rotationDirection, width: `${size}px`, height: `${size}px`,
        backgroundImage: `url(/snow${randomImage}.png)`, backgroundSize: 'cover',
      }} />;
    });
  }, []);

  return (
    <>
      <style jsx global>{`
        .video-background { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; pointer-events: none; overflow: hidden; background: black; }
        
        .video-background iframe { 
          position: absolute; 
          top: 50%; 
          left: 50%; 
          width: 100vw; 
          height: 100vh; 
          transform: translate(-50%, -50%) scale(1.5);
        }
        
        @media (max-aspect-ratio: 16/9) {
          .video-background iframe {
            width: 177.78vh;
            height: 100vh;
          }
        }
        
        @media (min-aspect-ratio: 16/9) {
          .video-background iframe {
            width: 100vw;
            height: 56.25vw;
          }
        }
        .video-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); pointer-events: none; }
        .snow-container { pointer-events: none; overflow: hidden; z-index: 40; }
        .snowflake { position: absolute; animation: fall var(--fall-duration) linear infinite, tumble var(--rotation-duration) linear infinite; transform-origin: center; filter: brightness(1.5); }
        @keyframes fall { to { top: var(--page-height); left: calc(var(--base-left) - 50vw); } }
        @keyframes tumble { from { transform: rotate(0deg); } to { transform: rotate(calc(var(--rotation-direction) * 360deg)); } }
        .font-fredericka { font-family: 'Fredericka the Great', cursive; }
        @keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes flyOut { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 100% { opacity: 1; transform: translateY(-50%) translateX(40px); } }
        @keyframes flyIn { 0% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        @keyframes flyOutStayIn { 0% { opacity: 0; transform: translateY(-50%) translateX(0); } 9% { opacity: 1; transform: translateY(-50%) translateX(40px); } 91% { opacity: 1; transform: translateY(-50%) translateX(40px); } 100% { opacity: 0; transform: translateY(-50%) translateX(0); } }
        .disk { width: 60px; height: 60px; border: 2px solid var(--colorone); border-radius: 50%; background-image: url('/blackcat.jpg'); background-size: cover; background-position: center; animation: rotate 10s linear infinite; }
        .disk.paused { animation-play-state: paused; }
        .title-fly-out { position: absolute; top: 50%; left: 50%; transform: translateY(-50%); color: var(--colorone); font-size: 1.125rem; font-weight: 600; font-style: italic; white-space: nowrap; opacity: 0; pointer-events: none; }
        .title-fly-out.fly-out { animation: flyOut 0.5s forwards; }
        .title-fly-out.fly-in { animation: flyIn 0.5s forwards; }
        .title-fly-out.fly-cycle { animation: flyOutStayIn 5.5s forwards; }
        @keyframes fingerprintFade {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(var(--rot)); }
          15% { opacity: 0.8; transform: translate(-50%, -50%) scale(1) rotate(var(--rot)); }
          80% { opacity: 0.8; transform: translate(-50%, -50%) scale(1) rotate(var(--rot)); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2) rotate(var(--rot)); }
        }
        .fingerprint-effect {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          color: var(--colorone);
          animation: fingerprintFade 5s forwards;
        }
      `}</style>

      <div className="video-background">
        <div id="bg-player"></div>
      </div>
      <div className="video-overlay"></div>

      {fingerprints.map(fp => (
        <div 
          key={fp.id} 
          className="fingerprint-effect" 
          style={{ 
            left: fp.x, 
            top: fp.y, 
            '--rot': `${fp.rotation}deg` 
          }}
        >
          <Fingerprint size={130} />
        </div>
      ))}

      {spotlightEnabled && (
        <div className="fixed inset-0 z-20 bg-black pointer-events-none transition-opacity duration-300 opacity-100" style={{
          maskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)`,
          WebkitMaskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)`,
        }} />
      )}

      {!isIntroStarted && (
        <div className="fixed inset-0 bg-[var(--colorone)] flex justify-center items-center z-[100]">
          <img src="/printer.png" alt="Start" className="w-24 h-24 cursor-pointer animate-pulse" onClick={() => setIsIntroStarted(true)} />
        </div>
      )}

      <div ref={scrollRef} className="w-full min-h-screen flex flex-col relative">
        <div ref={snowRef} className="absolute top-0 left-0 w-full snow-container">
          {mounted && snowflakes}
        </div>

        <div id="youtube-player" style={{ display: 'none' }}></div>

        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 p-4 md:p-10 flex justify-between items-center z-[60] transition-opacity duration-1000 ${isIntroStarted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="relative cursor-pointer" onClick={togglePlayPause} onMouseEnter={handleDiskMouseEnter} onMouseLeave={handleDiskMouseLeave}>
            <div className={`disk ${!isPlaying ? 'paused' : ''}`}></div>
            {videoTitle && (
              <span key={animationKey} className={`title-fly-out ${animationClass} font-fredericka`}>
                {videoTitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 md:gap-10 font-fredericka">
            <CaseArchivesCanvas />
            <div className="text-xl md:text-3xl font-semibold text-[var(--colorone)] hover:text-white cursor-pointer transition-colors" onClick={() => setIsStoryOpen(true)}>
              Application
            </div>
          </div>
        </header>

        {/* Story Overlay */}
        {isStoryOpen && (
          <div className="fixed inset-0 bg-[var(--colortwo)] z-[70] p-6 md:p-20 flex flex-col font-fredericka">
            <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} className="flex-1 text-lg md:text-2xl pt-10 text-white bg-transparent border-none outline-none resize-none no-scrollbar text-justify focus:text-[var(--colorone)]" />
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setIsStoryOpen(false)} className="px-6 py-2 bg-gray-500 text-white rounded font-fredericka">Cancel</button>
              <button onClick={handleStorySubmit} className="px-6 py-2 bg-[var(--colorone)] text-white rounded font-fredericka">Submit</button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <main className="w-full min-h-screen flex-shrink-0 relative flex items-start lg:items-center justify-center pt-24 lg:pt-0 pb-32 lg:pb-0" onMouseEnter={() => setSpotlightEnabled(true)} onMouseLeave={() => setSpotlightEnabled(false)}>
          <div className={`w-full transition-opacity duration-1000 ${isIntroStarted ? 'opacity-100' : 'opacity-0'}`}>
            <Hero isStoryOpen={isStoryOpen} />
          </div>
        </main>

        {/* Footer */}
        <footer className={`fixed bottom-0 left-0 right-0 p-4 pb-2 md:p-10 flex flex-col lg:flex-row justify-center lg:justify-between items-center gap-2 lg:gap-0 z-[60] bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-1000 ${isIntroStarted && !isStoryOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="order-2 lg:order-1 text-[var(--colorone)] font-fredericka text-[10px] md:text-sm opacity-60">
            I do not own media
          </div>
          <div className="order-1 lg:order-2 flex gap-6 z-20">
            <a href="https://www.youtube.com/watch?v=zqcrDCynF8k" target="_blank" rel="noopener noreferrer"><FaYoutube className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
            <a href="https://www.instagram.com/t22felton/" target="_blank" rel="noopener noreferrer"><FaInstagram className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
            <a href="https://github.com/thienphucope" target="_blank" rel="noopener noreferrer"><FaGithub className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
            <a href="mailto:thienphucmain@gmail.com"><FaEnvelope className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
            <a href="https://x.com/a" target="_blank" rel="noopener noreferrer"><FaTwitter className="text-[var(--colorone)] text-3xl md:text-5xl hover:text-white transition-colors" /></a>
          </div>
        </footer>
      </div>
    </>
  );
}
