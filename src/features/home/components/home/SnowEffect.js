"use client";
import { useEffect, useRef, useState, useCallback } from 'react';

export default function SnowEffect({ mounted }) {
  const snowRef = useRef(null);
  const [snowflakes, setSnowflakes] = useState(null);

  const updateSnow = useCallback(() => {
    const snowContainer = snowRef.current;
    if (snowContainer) {
      const scrollHeight = document.documentElement.scrollHeight;
      snowContainer.style.height = `${scrollHeight}px`;
      snowContainer.style.setProperty('--page-height', `${scrollHeight}px`);
      const flakes = snowContainer.querySelectorAll('.snowflake');
      flakes.forEach((flake) => {
        const startTop = Math.random() * -scrollHeight;
        flake.style.top = `${startTop}px`;
        const fallDuration = Math.random() * 5 + 5;
        flake.style.setProperty('--fall-duration', `${fallDuration}s`);
      });
    }
  }, []);

  useEffect(() => {
    if (mounted && !snowflakes) {
      const generated = Array.from({ length: 50 }).map((_, i) => {
        const randomImage = Math.floor(Math.random() * 3) + 1;
        const size = Math.random() * 10 + 100;
        const rotationDuration = Math.random() * 2 + 2;
        const rotationDirection = Math.random() > 0.5 ? 1 : -1;
        const initialLeft = Math.random() * 150;
        return (
          <div key={i} className="snowflake" style={{
            left: `${initialLeft}vw`, opacity: Math.random() * 0.5 + 0.5,
            '--base-left': `${initialLeft}vw`, '--rotation-duration': `${rotationDuration}s`,
            '--rotation-direction': rotationDirection, width: `${size}px`, height: `${size}px`,
            backgroundImage: `url(/snow${randomImage}.png)`, backgroundSize: 'cover',
          }} />
        );
      });
      setSnowflakes(generated);
    }
  }, [mounted, snowflakes]);

  useEffect(() => {
    if (mounted && snowflakes) {
      updateSnow();
      window.addEventListener('resize', updateSnow);
      return () => window.removeEventListener('resize', updateSnow);
    }
  }, [mounted, snowflakes, updateSnow]);

  if (!mounted || !snowflakes) return null;

  return (
    <div ref={snowRef} className="absolute top-0 left-0 w-full h-full snow-container pointer-events-none">
      {snowflakes}
    </div>
  );
}
