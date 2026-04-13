import { useEffect } from 'react';

/**
 * "Break the glass" pattern for embedded video iframes.
 * A single click makes the container interactable for 1 second,
 * then restores the pointer-events shield so scroll is not stolen.
 */
export function useVideoInteraction() {
  useEffect(() => {
    const handleMouseDown = (e) => {
      const container = e.target.closest('.video-container');
      if (container && !container.classList.contains('interactable')) {
        container.classList.add('interactable');
        setTimeout(() => container.classList.remove('interactable'), 1000);
      }
    };

    const handleWheelRestore = () => {
      document.querySelectorAll('.video-container.interactable').forEach((c) => {
        c.classList.remove('interactable');
      });
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('wheel', handleWheelRestore, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('wheel', handleWheelRestore);
    };
  }, []);
}
