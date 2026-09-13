import Gallery from '@/components/sections/Gallery';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';
import { getGalleryImages } from '@/lib/galleryImages';

export const metadata = {
  title: 'Gallery | Ope Watson',
  description: 'A gallery from the Ope Watson archive.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage() {
  const images = await getGalleryImages();
  return (
    <div className={theme.theme}>
      <Gallery images={images} />
    </div>
  );
}
