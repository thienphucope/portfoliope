"use client";
import { useEffect, useRef, useCallback } from 'react';

export default function useMomentumScroll() {
  const verticalScrollTarget = useRef(0);
  const isWheelScrolling = useRef(false);

  const startAnimation = useCallback(() => {
    if (isWheelScrolling.current) return;
    isWheelScrolling.current = true;
    
    const animate = () => {
      const currentY = window.scrollY;
      const diff = verticalScrollTarget.current - currentY;
      
      if (Math.abs(diff) < 0.5) {
        window.scrollTo({ top: verticalScrollTarget.current, behavior: 'auto' });
        isWheelScrolling.current = false;
      } else {
        const currentMax = document.documentElement.scrollHeight - window.innerHeight;
        if (verticalScrollTarget.current > currentMax) verticalScrollTarget.current = currentMax;

        window.scrollTo({ top: currentY + diff * 0.08, behavior: 'auto' });
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth <= 1024) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.shiftKey) return; 
      e.preventDefault();
      
      if (!isWheelScrolling.current) {
        verticalScrollTarget.current = window.scrollY;
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      verticalScrollTarget.current = Math.max(0, Math.min(verticalScrollTarget.current + e.deltaY * 0.8, maxScroll));
      
      startAnimation();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [startAnimation]);

  const scrollTo = useCallback((targetY) => {
    verticalScrollTarget.current = targetY;
    startAnimation();
  }, [startAnimation]);

  return { scrollTo };
}
