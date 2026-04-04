"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import AudioVisualProvider from '@/components/audio/AudioVisualProvider';
import Footer from '@/components/common/Footer';
import useFingerprints from '@/features/home/hooks/useFingerprints';
import useMomentumScroll from '@/features/home/hooks/useMomentumScroll';
import useSpotlight from '@/features/home/hooks/useSpotlight';
import CaseArchivesButton from './CaseArchivesButton';

export default function HomeClient() {
  useMomentumScroll();
  const fingerprints = useFingerprints();
  const { setSpotlightEnabled, spotlightOverlay } = useSpotlight();

  return (
    <AudioVisualProvider>
      <div className="min-h-screen relative flex flex-col" style={{ fontFamily: 'var(--md-font)' }}>
        {fingerprints}
        {spotlightOverlay}

        <main className="flex-1 flex flex-col justify-center lg:justify-end items-center relative z-10 overflow-hidden py-20 lg:py-0">
          <div className="w-full flex justify-center items-center lg:items-end lg:absolute lg:bottom-0">
            <div 
              className="relative group cursor-pointer inline-block"
              onMouseEnter={() => setSpotlightEnabled(true)}
              onMouseLeave={() => setSpotlightEnabled(false)}
            >
              <Link href="/case">
                <div className="absolute -inset-10 bg-[var(--colorone)] opacity-10 group-hover:opacity-25 blur-3xl transition-opacity duration-500 rounded-full"></div>

                {/* Image Container */}
                <div className="relative inline-block lg:translate-y-12">
                  <img 
                    src="/printer.png" 
                    alt="Digital Case Archives" 
                    className="w-[336px] h-auto lg:w-[768px] object-contain relative z-20" 
                  />

                  {/* Text on Paper - w-[50%] on PC and centered at top-[15%] */}
                  <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-30 w-[55%] lg:w-[50%] origin-center pointer-events-none">
                    <CaseArchivesButton />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </AudioVisualProvider>
  );
}
