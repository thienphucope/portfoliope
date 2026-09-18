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
  { name: 'Liujing', href: 'https://space.bilibili.com/437951672', Icon: SiBilibili },
  { name: 'Sama', href: 'https://x.com/sama', Icon: FaXTwitter },
  { name: 'Tibo', href: 'https://x.com/thsottiaux', Icon: FaXTwitter },
];

const REEL_SESSION_KEY = 'archive-reel-playback-v1';

// A clue is only dispensed after a random trivia question is answered. Questions
// come from Open Trivia DB (client-side, no key). Tweak the query to taste, e.g.
// &difficulty=easy or &category=9. Rate limit: ~1 request / 5s per IP.
const TRIVIA_URL = 'https://opentdb.com/api.php?amount=1&type=multiple';

// EDIT ME — owner's skip-the-quiz pass. Entered once, remembered forever on this
// browser. Client-side, so it's visible to anyone who digs; that's fine — the
// quiz is friction for non-tech, and finding the key is its own reward.
const MASTER_KEY = 'cumulonimbus';
const MASTER_STORAGE_KEY = 'archive-reel-master-v1';

// OpenTDB returns HTML-entity-encoded text (&quot;, &#039;, …); decode via the DOM.
const decode = (s) => {
  if (typeof document === 'undefined') return s;
  const t = document.createElement('textarea');
  t.innerHTML = s;
  return t.value;
};
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

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
  const [puzzle, setPuzzle] = useState(null); // { loading } | { error } | { cooldown } | { question, answer, options } — gates the next clue
  const [cooldown, setCooldown] = useState(0); // penalty seconds left after a wrong answer
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyErr, setKeyErr] = useState(false);
  const masterRef = useRef(false);
  const wrongStreakRef = useRef(0);
  const coolingRef = useRef(false);
  const playerRef = useRef(null);
  const reelDivRef = useRef(null);
  const videoGroupsRef = useRef([]);
  const videoIdRef = useRef(null);
  const loadedIdRef = useRef(null);
  const playedVideoIdsRef = useRef(new Set());
  const nextGroupIndexRef = useRef(0);
  const lastVideoIdRef = useRef(null);

  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  // Restore the skip-quiz pass if this browser unlocked it before.
  useEffect(() => {
    try {
      if (localStorage.getItem(MASTER_STORAGE_KEY) === '1') { masterRef.current = true; }
    } catch {}
  }, []);

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

  // Every clue after the first is locked behind a trivia question. Fetch one and
  // show it; the actual swap happens only when the right option is picked.
  const requestClue = useCallback(async () => {
    if (masterRef.current) { dispenseClue(); return; } // pass held → skip the quiz
    playerRef.current?.pauseVideo?.(); // freeze the current clip while the gate is up (no audio, no ENDED race)
    setPuzzle({ loading: true });
    try {
      const res = await fetch(TRIVIA_URL);
      const data = await res.json();
      const q = data?.results?.[0];
      if (data?.response_code !== 0 || !q) throw new Error('no question');
      const answer = decode(q.correct_answer);
      setPuzzle({
        question: decode(q.question),
        answer,
        options: shuffle([answer, ...q.incorrect_answers.map(decode)]),
      });
    } catch {
      setPuzzle({ error: true });
    }
  }, [dispenseClue]);

  const handlePick = useCallback((opt) => {
    if (!puzzle?.answer) return;
    if (opt === puzzle.answer) {
      wrongStreakRef.current = 0;
      setCooldown(0);
      setPuzzle(null);
      dispenseClue();
    } else {
      // Penalty: lock the quiz for a stretch that doubles with each miss (5→10→
      // 20…60s), so spamming one answer just piles on the wait. A fresh question
      // auto-loads when the timer drains (see the cooldown effect).
      wrongStreakRef.current += 1;
      setPuzzle({ cooldown: true });
      setCooldown(Math.min(5 * 2 ** (wrongStreakRef.current - 1), 60));
    }
  }, [puzzle, dispenseClue]);

  // Tick the penalty down once per second.
  useEffect(() => {
    if (cooldown <= 0) return;
    coolingRef.current = true;
    const id = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // When the penalty drains, pull a fresh question automatically.
  useEffect(() => {
    if (cooldown === 0 && coolingRef.current) { coolingRef.current = false; requestClue(); }
  }, [cooldown, requestClue]);

  const submitKey = useCallback((e) => {
    e.preventDefault();
    if (keyInput === MASTER_KEY) {
      try { localStorage.setItem(MASTER_STORAGE_KEY, '1'); } catch {}
      masterRef.current = true;
      setShowKey(false);
      setKeyInput('');
      setKeyErr(false);
      setCooldown(0);
      setPuzzle(null);
      dispenseClue();
    } else {
      setKeyErr(true);
    }
  }, [keyInput, dispenseClue]);

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
        // Gate even the first clip — otherwise reloading the page hands out clips
        // for free. Pass-holders skip straight to a clip.
        if (masterRef.current) dispenseClue(); else requestClue();
      })
      .catch(() => {});
    return () => { active = false; };
  }, [dispenseClue, requestClue]);

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
          onStateChange: (e) => { if (e.data === window.YT.PlayerState.ENDED) requestClue(); },
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
  }, [videoId, requestClue]);

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
          <button type="button" className={styles.reelShuffle} onClick={requestClue} disabled={new Set(videoGroups.flat()).size < 2} aria-label="Dispense another clue"><Shuffle size={15} strokeWidth={1.6} aria-hidden="true" /></button>
        </div>
        <div className={styles.reelFrame}>
          <div ref={reelDivRef} />
          {puzzle && (
            <div className={styles.reelPuzzle}>
              {puzzle.loading && <p className={styles.reelPuzzleQ}>Pulling a question…</p>}
              {puzzle.error && (
                <>
                  <p className={styles.reelPuzzleQ}>Couldn’t load a question.</p>
                  <button type="button" className={styles.reelPuzzleRetry} onClick={requestClue}>Retry</button>
                </>
              )}
              {puzzle.cooldown && (
                <p className={styles.reelPuzzleQ}>Wrong. Next question in {cooldown}s…</p>
              )}
              {puzzle.question && (
                <>
                  <p className={styles.reelPuzzleQ}>{puzzle.question}</p>
                  <div className={styles.reelPuzzleOpts}>
                    {puzzle.options.map((opt) => (
                      <button key={opt} type="button" onClick={() => handlePick(opt)}>{opt}</button>
                    ))}
                  </div>
                  <span className={styles.reelPuzzleHint}>Miss it and the wait doubles</span>
                </>
              )}
              {showKey ? (
                <form className={styles.reelKeyForm} onSubmit={submitKey}>
                  <input type="password" value={keyInput} onChange={(e) => { setKeyInput(e.target.value); if (keyErr) setKeyErr(false); }} placeholder="Master key" aria-label="Master key" autoFocus />
                  <button type="submit">Unlock</button>
                  {keyErr && <span className={styles.reelPuzzleErr}>Wrong key.</span>}
                </form>
              ) : (
                <button type="button" className={styles.reelKeyToggle} onClick={() => setShowKey(true)}>Have a key?</button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className={styles.sideSection} aria-labelledby="status-title">
        <h2 id="status-title">Wire</h2>
        <ul className={styles.statusList}>
          <li>Widening the denominator to improve the odds.</li>
          <li>Building lore and ritual for the character.</li>
          <li>Chasing the clues still missing.</li>
          <li>Trimming the surplus, one rep at a time.</li>
        </ul>
      </section>

      <section className={styles.sideSection} id="social" aria-labelledby="social-title">
        <h2 id="social-title">Comms</h2>
        <div className={styles.socialLinks}>{socialLinks.map(({ label, href, Icon }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer"><Icon size={22} aria-hidden="true" /><span>{label}</span></a>)}</div>
      </section>

      <section className={styles.sideSection} aria-labelledby="associates-title">
        <h2 id="associates-title">Informants</h2>
        <div className={styles.socialLinks}>{associates.map(({ name, href, Icon }) => <a key={href} href={href} target="_blank" rel="noopener noreferrer"><Icon size={22} aria-hidden="true" /><span>{name}</span></a>)}</div>
      </section>
    </aside>
  );
}
