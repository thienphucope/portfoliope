"use client";

import { useEffect, useState } from 'react';

const MINIMUM_VISIBLE_MS = 650;
const MAXIMUM_WAIT_MS = 2400;
const EXIT_MS = 480;

export default function BootScreen() {
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

  if (phase === 'gone') return null;

  return (
    <div
      className={`site-boot${phase === 'leaving' ? ' is-leaving' : ''}`}
      role="status"
      aria-label="Opening Ope Watson case file"
    >
      <span className="site-boot__tube" aria-hidden />
      <div className="site-boot__copy">
        <span className="site-boot__case">CASE FILE / 0510</span>
        <strong>OPE WATSON</strong>
        <span className="site-boot__progress" aria-hidden><i /></span>
        <small>developing evidence</small>
      </div>
    </div>
  );
}
