"use client";
import Page1 from './pages/Page1';
import Page2 from '../../bin/Page2';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [spotlightEnabled, setSpotlightEnabled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });

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

  if (isMobile) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[var(--background)] text-white text-xl p-4 text-center">
        This site is not accessible on mobile devices. Please use a desktop browser.
      </div>
    );
  }

  return (
    <>
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
        className="fixed bottom-30 right-7 text-6xl px-0 py-0 z-30 bg-transparent text-[var(--colorone)] rounded-full rounded-full cursor-pointer"
      >
        {spotlightEnabled ? '🌙' : '☀️'}
      </button>

      <div className="w-full min-h-screen flex flex-col snap-y snap-mandatory overflow-y-auto no-scrollbar bg-[var(--background)]">
        {/* Gallery Section */}
        <div className="w-full min-h-screen flex-shrink-0 snap-start">
          <Page1 />
        </div>
        
        {/* Cover Section */}
        <div className="w-full min-h-screen flex-shrink-0 snap-start">
          <Page2 />
        </div>
      </div>
    </>
  );
}