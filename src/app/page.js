import Hero from '@/components/sections/AboutHero';
import SnowEffect from '@/components/sections/SnowEffect';
import BulletinWall from '@/components/sections/BulletinWall';
import FingerprintEffect from '@/components/sections/FingerprintEffect';
import MomentumScroll from '@/components/layout/MomentumScroll';
import { getGalleryImages } from '@/lib/galleryImages';

export const metadata = {
  title: 'Ope Watson',
  description: 'Detective case archives, notes, and stories by Ope Watson.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const galleryImages = await getGalleryImages();
  return (
    <div className="min-h-[100dvh] flex flex-col bg-black">
      <div className="relative flex-1">
        <FingerprintEffect />
        <MomentumScroll />
        <main className="w-full min-h-[100dvh] flex-shrink-0 relative flex items-start lg:items-center justify-center pt-0">
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            <SnowEffect mounted={true} />
          </div>
          <div className="w-full transition-opacity duration-1000 opacity-100 relative">
            <Hero galleryImages={galleryImages} />
          </div>
        </main>
        <BulletinWall />
      </div>
    </div>
  );
}
