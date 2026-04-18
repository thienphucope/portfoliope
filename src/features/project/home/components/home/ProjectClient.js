"use client";
import Link from 'next/link';
import { FaBookOpen } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AudioVisualProvider from '@/components/audio/AudioVisualProvider';
import Footer from '@/components/common/Footer';
import useFingerprints from '@/features/project/home/hooks/useFingerprints';
import useMomentumScroll from '@/features/project/home/hooks/useMomentumScroll';
import useSpotlight from '@/features/project/home/hooks/useSpotlight';

export default function ProjectClient({ content = '' }) {
  useMomentumScroll();
  const fingerprints = useFingerprints();
  const { setSpotlightEnabled, spotlightOverlay } = useSpotlight();

  return (
    <AudioVisualProvider>
      <div className="relative z-20 flex flex-col" style={{ fontFamily: 'var(--md-font)' }}>
        {fingerprints}
        {spotlightOverlay}

        <main className="min-h-screen flex flex-col justify-center items-center relative z-10 overflow-hidden py-20 px-6 md:px-20">
          <div className="w-full flex flex-col items-center gap-16">
            <div
              className="relative group cursor-pointer inline-block"
              onMouseEnter={() => setSpotlightEnabled(true)}
              onMouseLeave={() => setSpotlightEnabled(false)}
            >
              <Link href="/project/casearchives">
                <div className="absolute -inset-10 bg-[var(--colorone)] opacity-10 group-hover:opacity-25 blur-3xl transition-opacity duration-500 rounded-full"></div>

                <div className="relative flex flex-col items-center py-0">
                  <h1 className="text-6xl md:text-9xl font-bold font-display text-[var(--colorone)] tracking-tighter group-hover:scale-105 transition-transform duration-500 drop-shadow-2xl text-center">
                    Case Archives
                  </h1>
                  <div className="relative mt-6 md:mt-10 transition-transform duration-500 group-hover:scale-115">
                    <div className="absolute inset-0 bg-[var(--colorone)] opacity-20 blur-2xl rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
                    <FaBookOpen
                      className="w-16 h-16 lg:w-24 lg:h-24 text-[var(--colorone)] relative z-10 drop-shadow-[0_0_35px_rgba(var(--colorone-rgb),0.6)]"
                    />
                  </div>
                </div>
              </Link>
            </div>

            {content && (
              <div className="max-w-4xl w-full">
                <article className="prose prose-invert prose-lg md:prose-xl max-w-none
                  prose-headings:font-fredericka prose-headings:text-[var(--colorone)]
                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-justify
                  prose-strong:text-[var(--colorone)]
                  prose-li:text-gray-300
                  prose-code:text-[var(--colorone)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                </article>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </AudioVisualProvider>
  );
}
