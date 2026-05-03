"use client";
import Hero from './components/Hero';
import SnowEffect from './components/SnowEffect';
import Background from '@/features/shared/components/Background';
import Header from '@/features/shared/components/Header';
import useFingerprints from '@/features/about/hooks/useFingerprints';
import useMomentumScroll from '@/features/shared/hooks/useMomentumScroll';

export default function AboutClient() {
  const fingerprints = useFingerprints();
  useMomentumScroll();

  return (
    <>
      <Background />
      <Header />
      {fingerprints}
      <main className="w-full min-h-[100dvh] flex-shrink-0 relative flex items-start lg:items-center justify-center pt-24 lg:pt-0 overflow-hidden">
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          <SnowEffect mounted={true} />
        </div>
        <div className="w-full transition-opacity duration-1000 opacity-100 relative z-10">
          <Hero />
        </div>
      </main>
    </>
  );
}
