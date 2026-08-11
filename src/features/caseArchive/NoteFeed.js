"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ensureLibsLoaded } from '@/lib/markdown';
import { useBootstrapData } from '@/features/caseArchive/hooks/useBootstrapData';
import { useFetchBatch, BATCH_SIZE } from '@/features/caseArchive/hooks/useFetchBatch';
import { useFeedEffects } from '@/features/caseArchive/hooks/useFeedEffects';
import CasesSection from '@/features/caseArchive/components/CasesSection';
import NoteFeedStyles from '@/features/caseArchive/styles/NoteFeedStyles';
import LampScene from '@/components/layout/LampScene';
import { CASE_BASE } from '@/configs/vault';

export default function NoteFeed({ onLinkClick, serverData }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [libsReady, setLibsReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const feedRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    ensureLibsLoaded().then(() => setLibsReady(true));
  }, []);

  const { allFiles, fileRegistry, fullContentCache, upsertCacheEntry } = useBootstrapData(serverData);
  const { displayedCases, loading, loadedCount, fetchBatch, totalCount } = useFetchBatch({
    allFiles, fileRegistry, fullContentCache, upsertCacheEntry, isMounted, libsReady, searchTerm,
  });
  useFeedEffects({ isMounted, displayedCases, libsReady, feedRef });

  const handleLinkClick = (targetId) => {
    if (onLinkClick) {
      const link = document.createElement('a');
      link.setAttribute('data-target', targetId);
      link.classList.add('internal-link');
      onLinkClick({ target: link, preventDefault: () => {} });
    } else {
      router.push(`${CASE_BASE}/${targetId.replace(/\.md$/i, '')}`);
    }
  };

  return (
    <>
      {isMounted && (
        <main className="nf-feed nf-gallery-feed" ref={feedRef}>
          <LampScene />
          <CasesSection
            displayedCases={displayedCases}
            onLinkClick={handleLinkClick}
            loadedCount={loadedCount}
            totalCount={totalCount}
            loading={loading}
            onLoadMore={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showDesktopDiscuss
          />
          <footer className="nf-legal-links" style={{ marginTop: 28, paddingBottom: 8 }}>
            <Link href="/privacy">Privacy</Link>
            <span className="nf-legal-sep">·</span>
            <Link href="/terms">Terms</Link>
          </footer>
        </main>
      )}
      <NoteFeedStyles />
    </>
  );
}
