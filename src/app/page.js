"use client";
import Hero from './components/Hero';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [mounted, setMounted] = useState(false); // Add this to track client-side mount
  const scrollRef = useRef(null);
  const snowRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    setMounted(true); // Set mounted after first render on client
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'tablet', 'android', 'iphone', 'ipad', 'windows phone'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
        window.innerWidth < 768; 
      
      if (isMobileDevice) {
        router.replace('/case');
      }
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    if (spotlightEnabled) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [spotlightEnabled]);

  const updateSnow = useCallback(() => {
    const scrollContainer = scrollRef.current;
    const snowContainer = snowRef.current;
    if (scrollContainer && snowContainer) {
      const scrollHeight = scrollContainer.scrollHeight;
      snowContainer.style.height = `${scrollHeight}px`;
      snowContainer.style.setProperty('--page-height', `${scrollHeight}px`);
      const flakes = snowContainer.querySelectorAll('.snowflake');
      const numScreens = scrollHeight / window.innerHeight;
      flakes.forEach((flake) => {
        const startTop = Math.random() * -scrollHeight;
        flake.style.top = `${startTop}px`;
        const baseFallDuration = Math.random() * 1 + 1; // Rơi rất nhanh: 2-5s base
        const fallDuration = baseFallDuration * numScreens;
        flake.style.setProperty('--fall-duration', `${fallDuration}s`);
      });
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    const snowContainer = snowRef.current;
    if (scrollContainer && snowContainer) {
      scrollContainer.style.position = 'relative';
      updateSnow();

      // Use ResizeObserver to watch for height changes (e.g., dynamic content loading)
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(() => {
          // Debounce to avoid too frequent updates
          clearTimeout(resizeObserverRef.current?.timeout);
          resizeObserverRef.current.timeout = setTimeout(updateSnow, 100);
        });
        resizeObserverRef.current.observe(scrollContainer);
      } else {
        // Fallback: MutationObserver for child changes
        const mutationObserver = new MutationObserver(() => {
          clearTimeout(mutationObserver.timeout);
          mutationObserver.timeout = setTimeout(updateSnow, 200);
        });
        mutationObserver.observe(scrollContainer, { childList: true, subtree: true, attributes: true });
        resizeObserverRef.current = mutationObserver;
      }

      window.addEventListener('resize', updateSnow);
      return () => {
        window.removeEventListener('resize', updateSnow);
        if (resizeObserverRef.current) {
          if (resizeObserverRef.current.disconnect) {
            resizeObserverRef.current.disconnect();
          }
          clearTimeout(resizeObserverRef.current.timeout);
        }
      };
    }
  }, [updateSnow]);

  const snowflakeCount = 50;
  const snowflakes = useMemo(() => {
    return Array.from({ length: snowflakeCount }).map((_, i) => {
      const randomImage = Math.floor(Math.random() * 3) + 1;
      const size = Math.random() * 10 + 100; // 100-110px
      const rotationDuration = Math.random() * 2 + 2; // Xoay nhanh hơn: 2-4s
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const initialLeft = Math.random() * 150; // Bắt đầu rộng hơn để khi dạt vào không bị trống bên phải
      const style = {
        left: `${initialLeft}vw`,
        opacity: Math.random() * 0.5 + 0.5,
        '--base-left': `${initialLeft}vw`,
        '--rotation-duration': `${rotationDuration}s`,
        '--rotation-direction': rotationDirection,
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(/snow${randomImage}.png)`,
        backgroundSize: 'cover',
      };
      return <div key={i} className="snowflake" style={style} />;
    });
  }, []);

  return (
    <>
      <style jsx global>{`
        .video-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          pointer-events: none;
          overflow: hidden;
          background: black;
        }
        
        .video-background iframe {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 100vw;
          height: 100vh;
          transform: translate(-50%, -50%) scale(1.2); /* Scale nhẹ để tránh lộ biên */
        }
        
        @media (min-aspect-ratio: 16/9) {
          .video-background iframe {
            height: 56.25vw;
          }
        }
        
        @media (max-aspect-ratio: 16/9) {
          .video-background iframe {
            width: 177.78vh;
          }
        }

        /* Lớp phủ để video tối xuống, Noir hơn */
        .video-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -1;
          background: rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        .snow-container {
          pointer-events: none;
          overflow: hidden;
          z-index: 40;
        }
        .snowflake {
          position: absolute;
          animation: fall var(--fall-duration) linear infinite, 
                     tumble var(--rotation-duration) linear infinite;
          transform-origin: center;
          filter: brightness(1.5);
        }
        @keyframes fall {
          to {
            top: var(--page-height);
            left: calc(var(--base-left) - 50vw); /* Dạt mạnh sang trái 50vw */
          }
        }
        @keyframes tumble {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(calc(var(--rotation-direction) * 360deg));
          }
        }
        .fog {
          background: linear-gradient(to top, rgba(194, 163, 138, 0.2), transparent);
          opacity: 0.4;
          pointer-events: none;
          z-index: 39;
        }
      `}</style>

      {/* Background Video */}
      <div className="video-background">
        <iframe
          src="https://www.youtube.com/embed/305Uc8i5RJM?autoplay=1&mute=1&controls=0&loop=1&playlist=305Uc8i5RJM&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&start=37&end=124"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
      </div>
      <div className="video-overlay"></div>

      {/* Spotlight Overlay - Global Dark Mode Effect */}
      {spotlightEnabled && (
        <div
          className={`
            fixed inset-0 z-20 
            bg-black 
            pointer-events-none 
            transition-opacity duration-300
            opacity-100
          `}
          style={{
            maskImage: `radial-gradient(
              circle 500px at ${mousePos.x}px ${mousePos.y}px, 
              transparent 0%, 
              transparent 35%, 
              rgba(0,0,0,0.3) 60%, 
              rgba(0,0,0,0.8) 100%
            )`,
            WebkitMaskImage: `radial-gradient(
              circle 500px at ${mousePos.x}px ${mousePos.y}px, 
              transparent 0%, 
              transparent 35%, 
              rgba(0,0,0,0.3) 60%, 
              rgba(0,0,0,0.8) 100%
            )`,
          }}
        />
      )}

      <div ref={scrollRef} className="w-full min-h-screen flex flex-col overflow-y-auto no-scrollbar">
        {/* Snow Effect - Render snowflakes only after mount to avoid hydration mismatch */}
        <div ref={snowRef} className="absolute top-0 left-0 w-full snow-container">
          {mounted && snowflakes}
        </div>

        {/* Hero Section */}
        <div 
          className="w-full min-h-screen flex-shrink-0 snap-start relative"
          onMouseEnter={() => setSpotlightEnabled(true)}
          onMouseLeave={() => setSpotlightEnabled(false)}
        >
          <Hero />
        </div>
      </div>
    </>
  );
}