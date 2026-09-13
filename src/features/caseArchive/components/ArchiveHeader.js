import Link from 'next/link';
import styles from '../styles/ArchiveHeader.module.css';

export default function ArchiveHeader({ reader = false, newTab = false }) {
  const tab = newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="Ope Watson home">
        <span className={styles.wordmark}>ΟΠΕ</span>
      </Link>
      <nav className={styles.navigation} aria-label="Sections">
        <Link href="/casearchive" aria-label="Cases" aria-current={reader ? undefined : 'page'} {...tab}>κασες</Link>
        <span aria-hidden="true">/</span>
        <Link href="/gallery" aria-label="Gallery" {...tab}>γαλλερυ</Link>
      </nav>
    </header>
  );
}
