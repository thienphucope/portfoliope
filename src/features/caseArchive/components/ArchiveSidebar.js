"use client";
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FaGithub, FaDiscord, FaRegEnvelope } from 'react-icons/fa';
import MusicHeader from '@/components/sections/MusicHeader';
import { SOCIAL_LINKS } from '@/configs/social';
import galleryImages from '@/data/galleryImages.json';
import styles from '../styles/NoteFeed.module.css';

const socialLinks = [
  { label: 'GitHub', href: SOCIAL_LINKS.github, Icon: FaGithub },
  { label: 'Discord', href: SOCIAL_LINKS.discord, Icon: FaDiscord },
  { label: 'Email', href: SOCIAL_LINKS.email, Icon: FaRegEnvelope },
];

export default function ArchiveSidebar() {
  const [index, setIndex] = useState(0);
  const [failedSource, setFailedSource] = useState(null);
  const photo = galleryImages[index];
  const move = (direction) => setIndex((current) => (current + direction + galleryImages.length) % galleryImages.length);

  return (
    <aside className={styles.sidebar} aria-label="From the desk">
      {photo && <section className={styles.gallery} aria-label="Photo gallery" aria-roledescription="carousel" onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}>
        <div className={styles.photoStack}>
          <div className={styles.photoFrame} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${galleryImages.length}`}>
            <Link href="/gallery" className={styles.photoLink} aria-label={`Open gallery: ${photo.title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={photo.src} src={failedSource === photo.src ? '/placeholder.jpg' : photo.src} alt={photo.title} className={styles.photo} onError={() => setFailedSource(photo.src)} />
            </Link>
            <div className={styles.photoCaption}><span>{photo.title}</span><span>{String(index + 1).padStart(2, '0')} / {String(galleryImages.length).padStart(2, '0')}</span></div>
          </div>
        </div>
        <div className={styles.galleryFooter}>
          <Link href="/gallery">From the gallery</Link>
          <div className={styles.galleryControls}>
            <button type="button" onClick={() => move(-1)} aria-label="Previous photo" disabled={galleryImages.length < 2}><ArrowLeft size={18} strokeWidth={1.5} /></button>
            <button type="button" onClick={() => move(1)} aria-label="Next photo" disabled={galleryImages.length < 2}><ArrowRight size={18} strokeWidth={1.5} /></button>
          </div>
        </div>
        <span className={styles.srOnly} aria-live="polite" aria-atomic="true">Photo {index + 1} of {galleryImages.length}: {photo.title}</span>
      </section>}

      <section className={styles.sideSection} aria-labelledby="status-title">
        <h2 id="status-title">Status</h2>
        <ul className={styles.statusList}>
          <li>Building, debugging, and taking notes.</li>
          <li>Turning small experiments into useful tools.</li>
          <li>Reading the docs. Then reading them again.</li>
          <li>Making a little room for the next idea.</li>
        </ul>
      </section>

      <section className={styles.sideSection} aria-labelledby="a-note-title">
        <h2 id="a-note-title">A Note</h2>
        <blockquote className={styles.quote} cite="https://invention.si.edu/invention-stories/girls-get-science-and-invention">
          <p>“I have not failed. I’ve just found 10,000 ways that won’t work.”</p>
          <footer>— <a href="https://invention.si.edu/invention-stories/girls-get-science-and-invention" target="_blank" rel="noopener noreferrer">Thomas A. Edison</a></footer>
        </blockquote>
      </section>

      <section className={styles.sideSection} id="social" aria-labelledby="social-title">
        <h2 id="social-title">Social</h2>
        <div className={styles.socialLinks}>{socialLinks.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer"><Icon size={22} aria-hidden="true" /><span>{label}</span></a>)}</div>
        <div className={styles.music}><span>On the record</span><MusicHeader className={styles.musicControl} /></div>
      </section>
    </aside>
  );
}
