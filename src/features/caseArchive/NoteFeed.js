"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, MessageSquare, Volume2, LayoutDashboard } from 'lucide-react';
import { ensureLibsLoaded } from '@/lib/markdown';
import { useBootstrapData } from '@/features/caseArchive/hooks/useBootstrapData';
import { useFetchBatch, BATCH_SIZE } from '@/features/caseArchive/hooks/useFetchBatch';
import { useFeedEffects } from '@/features/caseArchive/hooks/useFeedEffects';
import CasesSection from '@/features/caseArchive/components/CasesSection';
import ArchiveHeader from '@/features/caseArchive/components/ArchiveHeader';
import ArchiveSidebar from '@/features/caseArchive/components/ArchiveSidebar';
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
            <section className={styles.hero} aria-labelledby="archive-title">
              <div className={styles.heroMeta}><span>Notes / Ideas / Experiments</span><span>Ope Watson’s working collection</span></div>
              <h1 id="archive-title">Case Archives<span>.</span></h1>
            </section>
            <div className={styles.columns}>
            <div className={styles.primary}>
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
            <section id="applications" className={styles.applications} aria-labelledby="applications-title">
              <div className="nf-section-heading"><h2 id="applications-title">Applications</h2><span className={styles.sectionLabel}>Tools from the workbench</span></div>
              <div className={styles.appGrid}>
                <Link href="/chat" className={styles.appCard}><MessageSquare size={21} strokeWidth={1.3} aria-hidden="true" /><h3>AI Chat Vault</h3><p>A conversation with the archive.</p><ArrowUpRight size={16} className={styles.appArrow} aria-hidden="true" /></Link>
                <Link href="/voice" className={styles.appCard}><Volume2 size={21} strokeWidth={1.3} aria-hidden="true" /><h3>Text to Speech</h3><p>Give written words a voice.</p><ArrowUpRight size={16} className={styles.appArrow} aria-hidden="true" /></Link>
                <Link href="/noirboard" className={styles.appCard}><LayoutDashboard size={21} strokeWidth={1.3} aria-hidden="true" /><h3>Noir Board</h3><p>A place to connect the pieces.</p><ArrowUpRight size={16} className={styles.appArrow} aria-hidden="true" /></Link>
              </div>
            </section>
            </div>
            <ArchiveSidebar />
            </div>
          </main>
          <footer className={`nf-legal-links ${styles.footer}`}>
            <p className={styles.footerQuote}>“I have not failed. I’ve just found 10,000 ways that won’t work.” <span>— Thomas A. Edison</span></p>
            <span className="nf-legal-sep">© {new Date().getFullYear()} Ope Watson</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
