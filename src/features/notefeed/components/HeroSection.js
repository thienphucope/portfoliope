'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaGithub, FaEnvelope, FaDiscord } from 'react-icons/fa';
import { SOCIAL_LINKS } from '@/configs/social';

const TTS_URL = "https://thienphuc1052004--gpt-sovits-api-gptsovitsapi-tts.modal.run";

export default function HeroSection() {
  const containerRef = useRef(null);
  const titleFrameRef = useRef(null);
  const opeRef = useRef(null);
  const watsonRef = useRef(null);

  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [ttsError, setTtsError] = useState(null);
  const prevAudioUrlRef = useRef(null);

  const handleGenerate = useCallback(async () => {
    const text = ttsText.trim();
    if (!text || ttsLoading) return;
    setTtsLoading(true);
    setTtsError(null);
    if (prevAudioUrlRef.current) {
      URL.revokeObjectURL(prevAudioUrlRef.current);
      prevAudioUrlRef.current = null;
    }
    setAudioUrl(null);
    try {
      const res = await fetch(TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_text: text, target_lang: 'en', speed: 1.0 }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      prevAudioUrlRef.current = url;
      setAudioUrl(url);
    } catch (e) {
      setTtsError('Generation failed. The voice server may be cold — try again in a moment.');
    } finally {
      setTtsLoading(false);
    }
  }, [ttsText, ttsLoading]);

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

  return (
    <div className="nf-hero-content" ref={containerRef}>
      <div className="nf-title-frame" ref={titleFrameRef}>
        <span className="nf-corner-dot nf-corner-dot-tr" />
        <span className="nf-corner-dot nf-corner-dot-bl" />
        <h1 className="nf-title">
          <span className="nf-title-row" ref={opeRef}>
            Ope
            <Link href="/noirboard" target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="nf-title-img" src="/ope.png" alt="Inspect Board" />
            </Link>
          </span>
          <span className="nf-italic" ref={watsonRef}>Watson</span>
        </h1>
      </div>
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
      <div className="nf-tts-section">
        <div className="nf-tts-header">
          <div className="nf-tts-label">VOICE DEMO</div>
          <button
            className={`nf-tts-btn${ttsLoading ? ' loading' : ''}`}
            onClick={handleGenerate}
            disabled={!ttsText.trim() || ttsLoading}
          >
            {ttsLoading ? '[ GENERATING... ]' : '[ GEN ]'}
          </button>
        </div>
        <textarea
          className="nf-tts-input"
          placeholder="Enter English text to synthesize..."
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          rows={3}
          disabled={ttsLoading}
        />
        {ttsError && <p className="nf-tts-error">{ttsError}</p>}
        {audioUrl && (
          <audio className="nf-tts-audio" controls src={audioUrl} autoPlay />
        )}
      </div>
      <div className="nf-hero-divider" />
    </div>
  );
}
