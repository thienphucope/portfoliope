import Gallery from '@/components/sections/Gallery';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';

export const metadata = {
  title: 'Gallery | Ope Watson',
  description: 'A gallery from the Ope Watson archive.',
  alternates: { canonical: '/gallery' },
};

export default function GalleryPage() {
  return (
    <div className={theme.theme}>
      <Gallery />
    </div>
  );
}
