"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import { FaBookOpen } from 'react-icons/fa';
import AudioVisualProvider from '@/components/audio/AudioVisualProvider';
import Footer from '@/components/common/Footer';
import useFingerprints from '@/features/project/home/hooks/useFingerprints';
import useMomentumScroll from '@/features/project/home/hooks/useMomentumScroll';
import useSpotlight from '@/features/project/home/hooks/useSpotlight';

export default function ProjectClient() {
  useMomentumScroll();
  const fingerprints = useFingerprints();
  const { setSpotlightEnabled, spotlightOverlay } = useSpotlight();

  return (
    <AudioVisualProvider>
      <div className="min-h-screen relative z-20 flex flex-col" style={{ fontFamily: 'var(--md-font)' }}>
        {fingerprints}
        {spotlightOverlay}

        <main className="flex-1 flex flex-col justify-center items-center relative z-10 overflow-hidden py-20">
          <div className="w-full flex justify-center items-center">
            <div 
              className="relative group cursor-pointer inline-block"
              onMouseEnter={() => setSpotlightEnabled(true)}
              onMouseLeave={() => setSpotlightEnabled(false)}
            >
              <Link href="/project/casearchives">
                <div className="absolute -inset-10 bg-[var(--colorone)] opacity-10 group-hover:opacity-25 blur-3xl transition-opacity duration-500 rounded-full"></div>

                {/* Icon and Text Container */}
                <div className="relative flex flex-col items-center py-0">
                  <div className="relative mb-6 md:mb-10 transition-transform duration-500 group-hover:scale-115">
                    {/* Glowing background for icon */}
                    <div className="absolute inset-0 bg-[var(--colorone)] opacity-20 blur-2xl rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
                    <FaBookOpen 
                      className="w-32 h-32 lg:w-[448px] lg:h-[448px] text-[var(--colorone)] relative z-10 drop-shadow-[0_0_35px_rgba(var(--colorone-rgb),0.6)]" 
                    />
                  </div>
                  <h1 className="text-6xl md:text-9xl font-bold font-display text-[var(--colorone)] tracking-tighter group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl text-center">
                    Case Archives
                  </h1>
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
