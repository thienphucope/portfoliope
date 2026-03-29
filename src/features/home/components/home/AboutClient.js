"use client";
import Hero from './Hero';
import SnowEffect from './SnowEffect';
import AudioVisualProvider from '@/components/audio/AudioVisualProvider';
import useFingerprints from '@/features/home/hooks/useFingerprints';
import useMomentumScroll from '@/features/home/hooks/useMomentumScroll';

export default function AboutClient() {
  const fingerprints = useFingerprints();
  useMomentumScroll();

  return (
    <AudioVisualProvider>
      {fingerprints}
      <main className="w-full min-h-[100dvh] flex-shrink-0 relative flex items-start lg:items-center justify-center pt-24 lg:pt-0 overflow-hidden">
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          <SnowEffect mounted={true} />
        </div>
        <div className="w-full transition-opacity duration-1000 opacity-100 relative z-10">
          <Hero />
        </div>
      </main>
    </AudioVisualProvider>
  );
}
