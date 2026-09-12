"use client";
import { useState, useEffect, useRef } from 'react';
import { Shuffle } from 'lucide-react';
import { FaGithub, FaDiscord, FaRegEnvelope, FaGlobe } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiSubstack, SiBilibili } from 'react-icons/si';
import MusicHeader from '@/components/sections/MusicHeader';
import { SOCIAL_LINKS } from '@/configs/social';
import styles from '../styles/NoteFeed.module.css';

const socialLinks = [
  { label: 'GitHub', href: SOCIAL_LINKS.github, Icon: FaGithub },
  { label: 'Discord', href: SOCIAL_LINKS.discord, Icon: FaDiscord },
  { label: 'Email', href: SOCIAL_LINKS.email, Icon: FaRegEnvelope },
];

// Friends' sites — dofollow for mutual SEO; `name` is the anchor text.
const associates = [
  { name: 'Meyu', href: 'https://meyu.fyi/', Icon: FaGlobe },
  { name: 'Onibarou', href: 'https://onibarou.substack.com/', Icon: SiSubstack },
  { name: 'Bilibili', href: 'https://space.bilibili.com/437951672', Icon: SiBilibili },
  { name: '@sama', href: 'https://x.com/sama', Icon: FaXTwitter },
  { name: '@thsottiaux', href: 'https://x.com/thsottiaux', Icon: FaXTwitter },
];

export default function ArchiveSidebar() {
  const [videoIds, setVideoIds] = useState([]);
  const [videoId, setVideoId] = useState(null);
  const playerRef = useRef(null);
  const reelDivRef = useRef(null);
  const videoIdsRef = useRef([]);
  const videoIdRef = useRef(null);
  const loadedIdRef = useRef(null);

  useEffect(() => { videoIdsRef.current = videoIds; }, [videoIds]);
  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  const dispenseClue = () => setVideoId((current) => {
    const pool = videoIdsRef.current.filter((v) => v !== current);
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : current;
  });

  // Pull the gallery's embeddable clips and screen one at random.
  useEffect(() => {
    let active = true;
    fetch('/api/gallery-video')
      .then((r) => r.json())
      .then(({ videoIds }) => {
        if (!active || !videoIds?.length) return;
        setVideoIds(videoIds);
        setVideoId(videoIds[Math.floor(Math.random() * videoIds.length)]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Build the YouTube player once the first clip is ready; advance when a clip ends.
  useEffect(() => {
    if (!videoId || playerRef.current || !reelDivRef.current) return;
    const initPlayer = () => {
      if (!window.YT?.Player || playerRef.current || !reelDivRef.current) return;
      playerRef.current = new window.YT.Player(reelDivRef.current, {
        host: 'https://www.youtube-nocookie.com',
        width: '100%', height: '100%', videoId: videoIdRef.current,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => { if (e.data === window.YT.PlayerState.ENDED) dispenseClue(); },
        },
      });
      loadedIdRef.current = videoIdRef.current;
    };
    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); initPlayer(); };
    }
  }, [videoId]);

  // Swap the clip in place on shuffle / auto-advance (loadVideoById autoplays the next).
  useEffect(() => {
    const p = playerRef.current;
    if (!p?.loadVideoById || !videoId || videoId === loadedIdRef.current) return;
    p.loadVideoById(videoId);
    loadedIdRef.current = videoId;
  }, [videoId]);

  useEffect(() => () => { playerRef.current?.destroy?.(); playerRef.current = null; }, []);

  return (
    <aside className={styles.sidebar} aria-label="From the desk">
      <section className={styles.record} aria-label="Music player">
        <span className={styles.recordLabel}>On the record</span>
        <MusicHeader />
      </section>

      <section className={styles.reel} aria-label="Random clue dispenser">
        <div className={styles.reelHead}>
          <span className={styles.recordLabel}>Random clue dispenser</span>
          <button type="button" className={styles.reelShuffle} onClick={dispenseClue} disabled={videoIds.length < 2} aria-label="Dispense another clue"><Shuffle size={15} strokeWidth={1.6} aria-hidden="true" /></button>
        </div>
        <div className={styles.reelFrame}>
          <div ref={reelDivRef} />
        </div>
      </section>

      <section className={styles.sideSection} aria-labelledby="status-title">
        <h2 id="status-title">Status</h2>
        <ul className={styles.statusList}>
          <li>Building, debugging, and taking notes.</li>
          <li>Turning small experiments into useful tools.</li>
          <li>Reading the docs. Then reading them again.</li>
          <li>Making a little room for the next idea.</li>
        </ul>
      </section>

      <section className={styles.sideSection} id="social" aria-labelledby="social-title">
        <h2 id="social-title">Social</h2>
        <div className={styles.socialLinks}>{socialLinks.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer"><Icon size={22} aria-hidden="true" /><span>{label}</span></a>)}</div>
      </section>

      <section className={styles.sideSection} aria-labelledby="associates-title">
        <h2 id="associates-title">Associates</h2>
        <div className={styles.socialLinks}>{associates.map(({ name, href, Icon }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer"><Icon size={22} aria-hidden="true" /><span>{name}</span></a>)}</div>
      </section>
    </aside>
  );
}
