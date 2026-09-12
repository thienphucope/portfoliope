import NoteFeed from '@/features/caseArchive/NoteFeed';
import { hydrateServerCache } from '@/services/caseProvider';

export const metadata = {
  title: 'Ope Watson',
  description: 'Detective case archives, notes, and stories by Ope Watson.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  let serverData = null;
  try {
    serverData = await hydrateServerCache(false);
  } catch (error) {
    console.error('Failed to hydrate home archives:', error);
  }

  return <NoteFeed serverData={serverData} />;
}
