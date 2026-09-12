import NoteFeed from '@/features/caseArchive/NoteFeed';
import { hydrateServerCache } from '@/services/caseProvider';

export const metadata = {
  title: 'Ope Watson',
  description: 'Detective case archives, notes, and stories by Ope Watson.',
  alternates: { canonical: '/' },
};

// Archive content comes from GitHub at request time. Declaring this explicitly
// avoids a failed static-render probe (and misleading GitHub errors) during build.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let serverData = null;
  try {
    serverData = await hydrateServerCache(false);
  } catch (error) {
    console.error('Failed to hydrate home archives:', error);
  }

  return <NoteFeed serverData={serverData} />;
}
