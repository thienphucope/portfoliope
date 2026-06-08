'use client';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGithub, FaEnvelope, FaDiscord, FaComments, FaVolumeUp } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/configs/social';
import FeedFooter from '@/components/layout/FeedFooter';
import ChatRoom from '@/features/chatroom/ChatRoom';
import TextToSpeech from '@/features/texttospeech/TextToSpeech';

const FEATURE_REFS = [
  { id: 'chat', href: '/chat', label: 'Consult', desc: 'Chat room', Icon: FaComments },
  { id: 'voice', href: '/voice', label: 'Voice synthesis', desc: 'Text to speech', Icon: FaVolumeUp },
];

export default function HeroSection() {
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState('chat');
  const containerRef = useRef(null);
  const titleFrameRef = useRef(null);
  const opeRef = useRef(null);
  const watsonRef = useRef(null);

  useEffect(() => {
    const fit = () => {
      const container = titleFrameRef.current || containerRef.current;
      if (!container) return;
      const w = container.offsetWidth;

      const sizes = [opeRef, watsonRef].map((ref) => {
        const el = ref.current;
        if (!el) return Infinity;
        el.style.fontSize = '10px';
        return Math.floor(10 * (w / el.scrollWidth) * 0.95);
      });

      const minSize = Math.min(...sizes);
      [opeRef, watsonRef].forEach((ref) => {
        if (ref.current) ref.current.style.fontSize = minSize + 'px';
      });
    };

    const ro = new ResizeObserver(fit);
    const target = titleFrameRef.current || containerRef.current;
    if (target) ro.observe(target);

    // Recalculate once the image loads to include its physical width
    const imgs = containerRef.current?.querySelectorAll('img') || [];
    imgs.forEach(img => img.addEventListener('load', fit));

    fit();

    return () => {
      ro.disconnect();
      imgs.forEach(img => img.removeEventListener('load', fit));
    };
  }, []);

  const handleLinkClick = (targetId) => {
    router.push(`/${targetId.replace(/\.md$/i, '')}`);
  };

  return (
    <>
      <aside className="nf-hero">
        <div className="nf-hero-content" ref={containerRef}>
          <div className="nf-title-frame" ref={titleFrameRef}>
            <span className="nf-corner-dot nf-corner-dot-tr" />
            <span className="nf-corner-dot nf-corner-dot-bl" />
            <h1 className="nf-title">
              <span className="nf-title-row" ref={opeRef}>
                <span className="nf-title-italic">Ope</span>
                <img src="/cursor.png" alt="" style={{ height: '0.65em', width: 'auto', alignSelf: 'flex-end', marginLeft: '-0.2em', transform: 'scaleX(-1) rotate(15deg)' }} />
              </span>
              <span className="nf-italic" ref={watsonRef}>Watson</span>
            </h1>
          </div>
          <FeedFooter />
          <nav className="nf-legal-links">
            <Link href="/about">About</Link>
            <span className="nf-legal-sep">·</span>
            <Link href="/terms">Terms</Link>
            <span className="nf-legal-sep">·</span>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <div className="nf-socials">
            <a href={SOCIAL_LINKS.github}  target="_blank" rel="noopener noreferrer">
              <FaGithub className="nf-social-icon" />
              <span className="nf-social-label">GitHub <span className="nf-social-desc">— where I code</span></span>
            </a>
            <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
              <FaDiscord className="nf-social-icon" />
              <span className="nf-social-label">Discord <span className="nf-social-desc">— chat with agent Arii</span></span>
            </a>
            <a href={SOCIAL_LINKS.email}   target="_blank" rel="noopener noreferrer">
              <FaEnvelope className="nf-social-icon" />
              <span className="nf-social-label">Email <span className="nf-social-desc">— email me</span></span>
            </a>
          </div>
          <div className="nf-feature-refs">
            {FEATURE_REFS.map(({ id, href, label, desc, Icon }) => (
              <div className="nf-feature-ref-slot" key={id}>
                <button
                  type="button"
                  className={`nf-feature-ref nf-feature-ref-desktop${activeFeature === id ? ' is-active' : ''}`}
                  onClick={() => setActiveFeature(id)}
                  aria-pressed={activeFeature === id}
                >
                  <Icon className="nf-feature-ref-icon" />
                  <span className="nf-feature-ref-copy">
                    <span className="nf-feature-ref-label">{label}</span>
                    <span className="nf-feature-ref-desc">{desc}</span>
                  </span>
                </button>
                <Link href={href} className="nf-feature-ref nf-feature-ref-mobile">
                  <Icon className="nf-feature-ref-icon" />
                  <span className="nf-feature-ref-copy">
                    <span className="nf-feature-ref-label">{label}</span>
                    <span className="nf-feature-ref-desc">{desc}</span>
                  </span>
                </Link>
              </div>
            ))}
          </div>
          <div className="nf-hero-divider" />
        </div>
      </aside>
      <aside className="nf-sidekick">
        <div className="nf-feature-panel">
          <div className={`nf-feature-panel-slot${activeFeature === 'chat' ? ' is-active' : ''}`} aria-hidden={activeFeature !== 'chat'}>
            <div className="nf-feature-panel-fill">
              <ChatRoom isEmbedded onLinkClick={handleLinkClick} />
            </div>
          </div>
          <div className={`nf-feature-panel-slot${activeFeature === 'voice' ? ' is-active' : ''}`} aria-hidden={activeFeature !== 'voice'}>
            <div className="nf-feature-panel-body">
              <TextToSpeech />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
