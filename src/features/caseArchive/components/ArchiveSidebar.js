"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
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

const REEL_SESSION_KEY = 'archive-reel-playback-v1';

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((group) => [...new Set(
      (Array.isArray(group) ? group : []).filter((id) => typeof id === 'string' && id)
    )])
    .filter((group) => group.length);
}

function readReelSession(groups) {
  const available = new Set(groups.flat());
  const fallback = {
    played: new Set(),
    nextGroupIndex: Math.floor(Math.random() * groups.length),
    lastVideoId: null,
  };

  try {
    const stored = JSON.parse(sessionStorage.getItem(REEL_SESSION_KEY));
    if (!stored || typeof stored !== 'object') return fallback;

    const played = new Set(
      (Array.isArray(stored.played) ? stored.played : []).filter((id) => available.has(id))
    );
    const lastVideoId = available.has(stored.lastVideoId) ? stored.lastVideoId : null;
    if (lastVideoId) played.add(lastVideoId);

    return {
      played,
      nextGroupIndex: Number.isInteger(stored.nextGroupIndex)
        ? ((stored.nextGroupIndex % groups.length) + groups.length) % groups.length
        : fallback.nextGroupIndex,
      lastVideoId,
    };
  } catch {
    return fallback;
  }
}

function saveReelSession(played, nextGroupIndex, lastVideoId) {
  try {
    sessionStorage.setItem(REEL_SESSION_KEY, JSON.stringify({
      played: [...played],
      nextGroupIndex,
      lastVideoId,
    }));
  } catch {}
}

function pickFromNextGroup(groups, played, startIndex) {
  for (let offset = 0; offset < groups.length; offset += 1) {
    const groupIndex = (startIndex + offset) % groups.length;
    const candidates = groups[groupIndex].filter((id) => !played.has(id));
    if (candidates.length) {
      return {
        videoId: candidates[Math.floor(Math.random() * candidates.length)],
        nextGroupIndex: (groupIndex + 1) % groups.length,
      };
    }
  }
  return null;
}

export default function ArchiveSidebar() {
  const [videoGroups, setVideoGroups] = useState([]);
  const [videoId, setVideoId] = useState(null);
  const playerRef = useRef(null);
  const reelDivRef = useRef(null);
  const videoGroupsRef = useRef([]);
  const videoIdRef = useRef(null);
  const loadedIdRef = useRef(null);
  const playedVideoIdsRef = useRef(new Set());
  const nextGroupIndexRef = useRef(0);
  const lastVideoIdRef = useRef(null);

  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  const dispenseClue = useCallback(() => {
    const groups = videoGroupsRef.current;
    if (!groups.length) return;

    let played = playedVideoIdsRef.current;
    let choice = pickFromNextGroup(groups, played, nextGroupIndexRef.current);

    // Start a fresh cycle only after every available clip has been seen. Keeping
    // the last clip marked prevents an immediate repeat across the cycle boundary.
    if (!choice) {
      const lastVideoId = videoIdRef.current || lastVideoIdRef.current;
      played = lastVideoId && new Set(groups.flat()).size > 1
        ? new Set([lastVideoId])
        : new Set();
      choice = pickFromNextGroup(groups, played, nextGroupIndexRef.current);
    }

    if (!choice) return;
    played.add(choice.videoId);
    playedVideoIdsRef.current = played;
    nextGroupIndexRef.current = choice.nextGroupIndex;
    lastVideoIdRef.current = choice.videoId;
    videoIdRef.current = choice.videoId;
    saveReelSession(played, choice.nextGroupIndex, choice.videoId);
    setVideoId(choice.videoId);
  }, []);

  // Pull the gallery's embeddable clips, keeping their playlist boundaries.
  useEffect(() => {
    let active = true;
    fetch('/api/gallery-video')
      .then((r) => r.json())
      .then(({ groups }) => {
        if (!active) return;
        const normalizedGroups = normalizeGroups(groups);
        if (!normalizedGroups.length) return;

        const saved = readReelSession(normalizedGroups);
        videoGroupsRef.current = normalizedGroups;
        playedVideoIdsRef.current = saved.played;
        nextGroupIndexRef.current = saved.nextGroupIndex;
        lastVideoIdRef.current = saved.lastVideoId;
        setVideoGroups(normalizedGroups);
        dispenseClue();
      })
      .catch(() => {});
    return () => { active = false; };
  }, [dispenseClue]);

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
  }, [videoId, dispenseClue]);

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
          <button type="button" className={styles.reelShuffle} onClick={dispenseClue} disabled={new Set(videoGroups.flat()).size < 2} aria-label="Dispense another clue"><Shuffle size={15} strokeWidth={1.6} aria-hidden="true" /></button>
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
