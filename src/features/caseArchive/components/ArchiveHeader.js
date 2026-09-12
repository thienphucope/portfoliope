import Link from 'next/link';
import MusicHeader from '@/components/sections/MusicHeader';
import styles from '../styles/ArchiveHeader.module.css';

export default function ArchiveHeader() {
  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/">Ope Watson</Link>
      <nav className={styles.navigation} aria-label="Sections">
        <Link href="/chat">chat</Link>
        <Link href="/casearchive" aria-current="page">casearchives</Link>
        <Link href="/gallery">gallery</Link>
      </nav>
      <MusicHeader className={styles.contacts} promptLabel="discuss?" />
    </header>
  );
}
