import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './WorkspaceHeader.module.css';

export default function WorkspaceHeader({ label, children }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.home} aria-label="Back to Ope Watson archives">
        <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
        <span>OPE</span>
      </Link>
      <span className={styles.label}>{label}</span>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}
