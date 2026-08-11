import FingerprintEffect from '@/components/sections/FingerprintEffect';
import Gallery from '@/components/sections/Gallery';
import SnowEffect from '@/components/sections/SnowEffect';
import MomentumScroll from '@/components/layout/MomentumScroll';
import LampScene from '@/components/layout/LampScene';
import { getGalleryImages } from '@/lib/galleryImages';

export const metadata = {
  title: 'Gallery | Ope Watson',
  description: 'A gallery from the Ope Watson archive.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <div className="relative flex-1 teal-scene">
        <LampScene />
        <FingerprintEffect />
        <MomentumScroll />
        <main className="w-full min-h-[100dvh] flex-shrink-0 relative flex items-start justify-center pt-0 overflow-hidden">
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
            <SnowEffect mounted={true} />
          </div>
          <div className="w-full transition-opacity duration-1000 opacity-100 relative z-10">
            <Gallery images={images} showDesktopDiscuss />
          </div>
        </main>
      </div>
    </div>
  );
}
