"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ensureLibsLoaded } from '@/lib/markdown';
import { useBootstrapData } from '@/features/caseArchive/hooks/useBootstrapData';
import { useFetchBatch, BATCH_SIZE } from '@/features/caseArchive/hooks/useFetchBatch';
import { useFeedEffects } from '@/features/caseArchive/hooks/useFeedEffects';
import CasesSection from '@/features/caseArchive/components/CasesSection';
import ArchiveHeader from '@/features/caseArchive/components/ArchiveHeader';
import theme from '@/features/caseArchive/styles/ArchiveTheme.module.css';
import styles from '@/features/caseArchive/styles/NoteFeed.module.css';
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
    <div className={`${theme.theme} ${styles.shell}`}>
      <div className={`nf-feed ${styles.feed}`} ref={feedRef}>
        <div className={styles.sheet}>
          <ArchiveHeader />
          <main id="archive-content">
            <CasesSection
              displayedCases={displayedCases}
              onLinkClick={handleLinkClick}
              loadedCount={loadedCount}
              totalCount={totalCount}
              loading={loading || !isMounted || !libsReady}
              onLoadMore={() => fetchBatch(loadedCount, loadedCount + BATCH_SIZE)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </main>
          <footer className="nf-legal-links">
            <span className="nf-legal-sep">© {new Date().getFullYear()} Ope Watson</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
