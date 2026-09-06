"use client";

import { Component, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MusicHeader from '@/components/sections/MusicHeader';
import styles from './DeskLanding.module.css';

const DeskScene = dynamic(() => import('./DeskScene'), { ssr: false });

function UnavailableScene() {
  return <div className={styles.unavailable} role="status">
    <span>The study couldn’t be opened in this browser.</span>
    <p>You can still find all the notes in the case archives.</p>
    <Link href="/casearchive">Visit the case archives <span aria-hidden="true">↗</span></Link>
  </div>;
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('The detective desk could not be rendered.', error); this.props.onFailure(); }
  render() {
    return this.state.failed ? <UnavailableScene /> : this.props.children;
  }
}

export default function DeskLanding() {
  const [ready, setReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [supports3D, setSupports3D] = useState(null);
  const router = useRouter();
  const handleReady = useCallback(() => setReady(true), []);
  const handleContextLost = useCallback((event) => { event.preventDefault(); setContextLost(true); }, []);

  useEffect(() => {
    // Mobile skips the heavy 3D study and goes straight to the case archives.
    if (window.matchMedia('(max-width: 767px)').matches) { router.replace('/casearchive'); return; }
    // Renderer creation fails asynchronously on devices without WebGL2; check
    // before mounting Canvas so navigation and the fallback remain usable.
    let context;
    try { context = document.createElement('canvas').getContext('webgl2'); } catch { /* Unsupported GPU. */ }
    setSupports3D(Boolean(context));
    if (!context) setReady(true);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  }, [router]);

  return <section className={styles.landing} aria-labelledby="desk-title">
    <div className={`${styles.scene} ${ready ? styles.isReady : ''}`}>
      <SceneBoundary onFailure={handleReady}>
        {supports3D === false ? <UnavailableScene /> : contextLost ? <div className={styles.unavailable} role="status">
          <p>The scene was interrupted.</p><button type="button" onClick={() => { setReady(false); setContextLost(false); }}>Return to the desk</button>
        </div> : supports3D ? <DeskScene onReady={handleReady} onContextLost={handleContextLost} /> : null}
      </SceneBoundary>
    </div>
    {!ready && <div className={styles.loading} role="status"><span />Opening the study</div>}
    <div className={styles.atmosphere} aria-hidden="true" />
    <header className={styles.header}>
      <Link href="/" className={styles.wordmark} aria-label="Ope Watson home">OW<span>.</span></Link>
      <div className={styles.musicPlayer} title="Play / pause music">
        <MusicHeader />
      </div>
    </header>
    <div className={styles.foot}>
      <div className={styles.identity}>
        <p className={styles.eyebrow}>A desk full of loose ends</p>
        <h1 id="desk-title">Ope Watson<span>.</span></h1>
        <p className={styles.caption}>Notes, observations &amp; things worth keeping.</p>
      </div>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/chat">Chat</Link>
        <Link href="/casearchive">Case archives</Link>
        <Link href="/gallery">Gallery</Link>
      </nav>
    </div>
    <noscript><p className={styles.unavailable}>Explore Ope Watson’s notes through the case archives.</p></noscript>
  </section>;
}
