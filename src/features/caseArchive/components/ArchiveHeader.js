import Link from 'next/link';
import styles from '../styles/ArchiveHeader.module.css';

export default function ArchiveHeader({ reader = false, newTab = false }) {
  const tab = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ope Watson home">
        <span className={styles.wordmark}>OPE</span>
      </Link>
      <nav className={styles.navigation} aria-label="Sections">
        <Link href="/casearchive" aria-current={reader ? undefined : 'page'} {...tab}>Cases</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#applications">Tradecraft</Link>
        <span aria-hidden="true">/</span>
        <Link href="/gallery" {...tab}>Gallery</Link>
      </nav>
    </header>
  );
}
