"use client";
import Page1 from './pages/Page1';
import Page2 from '../../bin/Page2';
import Page3 from '../../bin/Page3';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
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
        window.innerWidth < 768; // Additional check for small screens
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
        const baseFallDuration = Math.random() * 30 + 48; // More variation: 8-23s base
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

  const snowflakeCount = 100;
  const snowflakes = useMemo(() => {
    return Array.from({ length: snowflakeCount }).map((_, i) => {
      const randomImage = Math.floor(Math.random() * 3) + 1;
      const swayDuration = Math.random() * 4 + 16; // 6-10s
      const swayAmplitude = Math.random() * 20 - 10; // -10 to 10px
      const size = Math.random() * 300 + 10; // 10-310px
      const rotationDuration = Math.random() * 1 + 10; // 4-12s for gentle spin
      const rotationDirection = Math.random() > 0.5 ? 1 : -1; // Random direction
      const style = {
        left: `${Math.random() * 100}vw`,
        opacity: Math.random() * 0.5 + 0.5,
        '--sway-duration': `${swayDuration}s`,
        '--sway-amplitude': `${swayAmplitude}px`,
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

  if (isMobile) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--background)] text-white text-xl p-4 text-center">
        This site is not accessible on mobile devices. Please use a desktop browser. Youre still able use the AI features.
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .snow-container {
          pointer-events: none;
          overflow: hidden;
          z-index: 40;
        }
        .snowflake {
          position: absolute;
          animation: fall var(--fall-duration) linear infinite, 
                     sway var(--sway-duration) ease-in-out infinite, 
                     tumble var(--rotation-duration) linear infinite;
          transform-origin: center;
          filter: brightness(1.5);
        }
        @keyframes fall {
          to {
            top: var(--page-height);
          }
        }
        @keyframes sway {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(var(--sway-amplitude));
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
          background: linear-gradient(to top, rgba(255, 255, 255, 0.5), transparent);
          opacity: 0.3;
          pointer-events: none;
          z-index: 39;
        }
      `}</style>

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
              circle 75vmax at ${mousePos.x}px ${mousePos.y}px, 
              transparent 0%, 
              transparent 20%, 
              rgba(0,0,0,0.3) 40%, 
              rgba(0,0,0,0.7) 70%, 
              black 100%
            )`,
            WebkitMaskImage: `radial-gradient(
              circle 75vmax at ${mousePos.x}px ${mousePos.y}px, 
              transparent 0%, 
              transparent 20%, 
              rgba(0,0,0,0.3) 40%, 
              rgba(0,0,0,0.7) 70%, 
              black 100%
            )`,
          }}
        />
      )}

      {/* Toggle Button - Fixed Position */}
      <button
        onClick={() => setSpotlightEnabled(!spotlightEnabled)}
        className="fixed top-32 right-2 text-6xl px-0 py-0 z-30 bg-transparent text-[var(--colorone)] rounded-full rounded-full cursor-pointer"
      >
        {spotlightEnabled ? '🌙' : '☀️'}
      </button>

      <div ref={scrollRef} className="w-full min-h-screen flex flex-col snap-y snap-mandatory overflow-y-auto no-scrollbar bg-[var(--background)]">
        {/* Snow Effect - Render snowflakes only after mount to avoid hydration mismatch */}
        <div ref={snowRef} className="absolute top-0 left-0 w-full snow-container">
          {mounted && snowflakes}
        </div>

        {/* Gallery Section */}
        <div className="w-full min-h-screen flex-shrink-0 snap-start relative">
          <Page1 />
        </div>
        
        {/* Cover Section */}
        <div className="w-full min-h-screen flex-shrink-0 snap-start relative">
          <Page2 />
        </div>

        {/* Cover Section */}
        <div className="w-full min-h-screen flex-shrink-0 snap-start relative">
          <Page3 />
        </div>

        {/* Fog Effect - at the bottom of the page */}
        <div className="fog absolute bottom-0 left-0 right-0 h-[50%] " />
      </div>
    </>
  );
}