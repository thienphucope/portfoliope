import Link from 'next/link';
import styles from '../styles/ArchiveHeader.module.css';

export default function ArchiveHeader({ reader = false }) {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ope Watson home">
        <span className={styles.wordmark}>OPE <span aria-hidden="true">—</span> <em>Secret Base</em></span>
      </Link>
      <nav className={styles.navigation} aria-label="Sections">
        <Link href="/casearchive" aria-current={reader ? undefined : 'page'}>Writing</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#applications">Applications</Link>
        <span aria-hidden="true">/</span>
        <Link href="/gallery">Gallery</Link>
      </nav>
    </header>
  );
}
