import DeskLanding from '@/components/desk/DeskLanding';

export const metadata = {
  title: 'Ope Watson',
  description: 'Detective case archives, notes, and stories by Ope Watson.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <main><DeskLanding /></main>;
}
