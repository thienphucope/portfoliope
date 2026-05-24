"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ensureLibsLoaded } from '@/features/casearchives/utils/markdown';
import { useBootstrapData } from './hooks/useBootstrapData';
import { useFetchBatch, BATCH_SIZE } from './hooks/useFetchBatch';
import { useFeedEffects } from './hooks/useFeedEffects';
import HeroSection from './components/HeroSection';
import CasesSection from './components/CasesSection';
import FeedFooter from './components/FeedFooter';
import ChatRoom from '@/features/chatroom/ChatRoom';
import NoteFeedStyles from './styles/NoteFeedStyles';

export default function NoteFeed({ onLinkClick, serverData }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  const { allFiles, fileRegistry, fullContentCache, upsertCacheEntry } = useBootstrapData(serverData);
  const { displayedCases, loading, loadedCount, fetchBatch, totalCount } = useFetchBatch({
    allFiles, fileRegistry, fullContentCache, upsertCacheEntry, isMounted, libsReady,
  });
  useFeedEffects({ isMounted, displayedCases, libsReady, feedRef });

  const handleLinkClick = (targetId) => {
    if (onLinkClick) {
      const link = document.createElement('a');
      link.setAttribute('data-target', targetId);
      link.classList.add('internal-link');
      onLinkClick({ target: link, preventDefault: () => {} });
    } else {
      router.push(`/${targetId.replace(/\.md$/i, '')}`);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="nf-shell">
      <aside className="nf-hero">
        <HeroSection />
      </aside>
      <aside className="nf-sidekick">
        <ChatRoom isEmbedded onLinkClick={handleLinkClick} />
      </aside>
      <main className="nf-feed" ref={feedRef}>
        <CasesSection
          displayedCases={displayedCases}
          onLinkClick={handleLinkClick}
          loadedCount={loadedCount}
          totalCount={totalCount}
          loading={loading}
          onLoadMore={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}
        />
        <FeedFooter />
      </main>
      <NoteFeedStyles />
    </div>
  );
}
