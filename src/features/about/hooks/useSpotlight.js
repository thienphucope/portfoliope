"use client";
import { useState, useEffect } from 'react';

/**
 * Custom hook to provide a spotlight (flashlight) effect.
 * Returns a state setter to enable/disable the effect and the JSX for the overlay.
 */
export default function useSpotlight() {
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    if (isEnabled) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isEnabled]);

  const spotlightOverlay = isEnabled ? (
    <div 
      className="fixed inset-0 z-20 bg-black pointer-events-none transition-opacity duration-300 opacity-100" 
      style={{
        maskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)`,
        WebkitMaskImage: `radial-gradient(circle 500px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)`,
      }} 
    />
  ) : null;

  return { setSpotlightEnabled: setIsEnabled, spotlightOverlay };
}
