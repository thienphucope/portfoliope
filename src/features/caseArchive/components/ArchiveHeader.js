import Link from 'next/link';
import { Search } from 'lucide-react';
import styles from '../styles/ArchiveHeader.module.css';

export default function ArchiveHeader({ onSearch, reader = false }) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ope Watson home">
        <span className={styles.wordmark}>OPE <span aria-hidden="true">—</span> <em>Lab Notes</em></span>
        <span className={styles.byline}>The personal archive of Ope Watson</span>
      </Link>
      <nav className={styles.navigation} aria-label="Sections">
        <Link href="/casearchive" aria-current={reader ? undefined : 'page'}>Writing</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#applications">Applications</Link>
        <span aria-hidden="true">/</span>
        <Link href="/gallery">Gallery</Link>
        <span aria-hidden="true">/</span>
        <Link href="/chat">Chat</Link>
        {onSearch && <button type="button" className={styles.search} onClick={onSearch} aria-label="Search archives"><Search size={20} strokeWidth={1.6} /></button>}
      </nav>
    </header>
  );
}
