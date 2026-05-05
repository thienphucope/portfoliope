import Background from '@/components/layout/Background';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/AboutHero';
import SnowEffect from '@/components/sections/SnowEffect';
import FingerprintEffect from '@/components/sections/FingerprintEffect';
import MomentumScroll from '@/components/layout/MomentumScroll';

export default async function AboutPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="relative flex-1">
        <Background />
        <Header />
        <FingerprintEffect />
        <MomentumScroll />
        <main className="w-full min-h-[100dvh] flex-shrink-0 relative flex items-start lg:items-center justify-center pt-24 lg:pt-0 overflow-hidden">
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            <SnowEffect mounted={true} />
          </div>
          <div className="w-full transition-opacity duration-1000 opacity-100 relative z-10">
            <Hero />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
