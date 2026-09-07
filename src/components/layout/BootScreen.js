"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const MINIMUM_VISIBLE_MS = 650;
const MAXIMUM_WAIT_MS = 2400;
const EXIT_MS = 480;

export default function BootScreen() {
  const pathname = usePathname();
  const [phase, setPhase] = useState('visible');

  useEffect(() => {
    const startedAt = performance.now();
    let minimumTimer;
    let fallbackTimer;
    let exitTimer;
    let dismissed = false;

    const leave = () => {
      if (dismissed) return;
      dismissed = true;
      const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (performance.now() - startedAt));

      minimumTimer = window.setTimeout(() => {
        setPhase('leaving');
        exitTimer = window.setTimeout(() => setPhase('gone'), EXIT_MS);
      }, remaining);
    };

    const waitForWindow = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
    const waitForFonts = document.fonts?.ready ?? Promise.resolve();

    Promise.all([waitForWindow, waitForFonts]).then(leave);
    fallbackTimer = window.setTimeout(leave, MAXIMUM_WAIT_MS);

    return () => {
      window.clearTimeout(minimumTimer);
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  // The home page has its own "Opening the study" loader; skip the site boot there.
  if (phase === 'gone' || pathname === '/') return null;

  return (
    <div
      className={`site-boot${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="status"
      aria-label="Opening the study"
    >
      <span className="site-boot__dot" aria-hidden />
      Opening the study
    </div>
  );
}
