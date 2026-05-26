export default function NoteFeedStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --nf-bg: #0a0a0c;
        --nf-txt: #e0e0e0;
        --nf-txt-dim: #aaaaaa;
        --nf-accent: #ba9170;
        --nf-accent-dim: #8a6b52;
        --nf-border: rgba(255,255,255,0.08);
        --nf-font-display: 'Playfair Display', Georgia, serif;
        --nf-font-mono: 'Special Elite', monospace;
        --nf-font-body: 'EB Garamond', Georgia, serif;
      }

      /* ── Shell ── */
      .nf-shell {
        position: fixed;
        inset: 0;
        display: flex;
        overflow: hidden;
        background: var(--nf-bg);
        color: var(--nf-txt);
        font-family: var(--nf-font-body);
      }

      /* ── Hero (left pane) ── */
      .nf-hero {
        flex: 1 1 0;
        min-width: 0;
        height: 100%;
        border-right: 1px solid var(--nf-border);
        display: flex;
        align-items: flex-start;
        padding: 32px 24px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        scrollbar-width: none;
      }
      .nf-hero::-webkit-scrollbar { display: none; }

      .nf-hero-content {
        display: flex;
        flex-direction: column;
        gap: 28px;
        width: 100%;
        max-width: 100%;
      }
      .nf-title-frame {
        position: relative;
        width: 100%;
        padding: 14px 0;
      }
      .nf-title-frame::before,
      .nf-title-frame::after {
        content: '';
        position: absolute;
        width: 60px;
        height: 60px;
      }
      .nf-corner-dot {
        position: absolute;
        font-size: 1rem;
        color: rgba(186,145,112,0.65);
        line-height: 1;
        font-weight: 900;
      }
      .nf-corner-dot::before { content: '✦'; }
      .nf-corner-dot-tr { top: 0; right: 0; transform: translate(50%, -50%); }
      .nf-corner-dot-bl { bottom: 0; left: 0; transform: translate(-50%, 50%); }

      .nf-title-frame::before {
        top: 0; left: 0;
        border-top: 5px solid rgba(186,145,112,0.65);
        border-left: 5px solid rgba(186,145,112,0.65);
      }
      .nf-title-frame::after {
        bottom: 0; right: 0;
        border-bottom: 5px solid rgba(186,145,112,0.65);
        border-right: 5px solid rgba(186,145,112,0.65);
      }

.nf-title {
  font-family: var(--nf-font-display);
  font-weight: 400;
  line-height: 1;
  margin: 0;
  color: var(--nf-txt);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: hidden;
}


.nf-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.nf-title-img {
  height: 1.15em;
  width: auto;
  object-fit: cover;
  display: block;
  opacity: 0.9;
  filter: grayscale(20%);
}

.nf-italic {
  font-style: italic;
  font-weight: 400;
  color: var(--nf-accent);
  white-space: nowrap;
}

      .nf-social-divider {
        width: 80px;
        height: 2px;
        background: var(--nf-accent-dim);
        margin: 6px auto;
        opacity: 0.5;
      }

      .nf-socials {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .nf-socials a {
        color: var(--nf-txt-dim);
        transition: color 0.2s;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid var(--nf-border);
      }
      .nf-socials a:first-child { border-top: 1px solid var(--nf-border); }
      .nf-socials a:hover { color: var(--nf-accent); }

      .nf-social-icon { font-size: 1rem; flex-shrink: 0; }

      .nf-social-label {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 1px;
      }

      .nf-social-desc {
        opacity: 0.65;
        font-size: 0.75rem;
      }

      .nf-hero-divider {
        width: 100%;
        height: 1px;
        background: var(--nf-border);
        margin-top: 32px;
      }

      /* ── TTS Section ── */
      .nf-tts-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .nf-tts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .nf-tts-label {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 3px;
        color: var(--nf-accent);
      }

      .nf-tts-input {
        background: transparent;
        border: 1px solid var(--nf-border);
        color: var(--nf-txt);
        font-family: var(--nf-font-body);
        font-size: 1rem;
        line-height: 1.5;
        padding: 10px 12px;
        resize: none;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .nf-tts-input::placeholder { color: var(--nf-txt-dim); opacity: 0.5; font-style: italic; }
      .nf-tts-input:focus { border-color: var(--nf-accent-dim); }
      .nf-tts-input:disabled { opacity: 0.5; }
      .nf-tts-input { scrollbar-width: thin; scrollbar-color: rgba(186,145,112,0.2) transparent; }
      .nf-tts-input::-webkit-scrollbar { width: 3px; }
      .nf-tts-input::-webkit-scrollbar-track { background: transparent; }
      .nf-tts-input::-webkit-scrollbar-thumb { background: rgba(186,145,112,0.2); border-radius: 0; }
      .nf-tts-input::-webkit-scrollbar-thumb:hover { background: rgba(186,145,112,0.4); }

      .nf-tts-btn {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--nf-txt-dim);
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 2px;
        padding: 8px 16px;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
      }
      .nf-tts-btn:hover:not(:disabled) { border-color: var(--nf-accent-dim); color: var(--nf-accent); }
      .nf-tts-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .nf-tts-btn.loading { color: var(--nf-accent); border-color: var(--nf-accent-dim); opacity: 0.7; }

      .nf-tts-error {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        color: #c07070;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .nf-tts-audio {
        width: 100%;
        filter: invert(1) sepia(1) saturate(0.5) hue-rotate(180deg);
        opacity: 0.8;
      }

      .info-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        position: relative;
      }
      .info-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid currentColor;
        font-family: monospace;
        font-size: 9px;
        font-weight: bold;
        cursor: help;
        opacity: 0.6;
        transition: opacity 0.2s;
        user-select: none;
        line-height: 1;
        position: relative;
        letter-spacing: normal;
      }
      .info-icon:hover {
        opacity: 1;
      }
      .info-icon::after {
        content: attr(data-tooltip);
        position: absolute;
        top: 125%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 10, 12, 0.95);
        color: var(--nf-txt);
        border: 1px solid var(--nf-accent);
        padding: 6px 10px;
        font-family: var(--nf-font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.5px;
        width: 180px;
        white-space: normal;
        word-wrap: break-word;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease, transform 0.15s ease;
        z-index: 999;
        text-transform: none;
        font-weight: normal;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      }
      .info-icon:hover::after {
        opacity: 1;
        transform: translateX(-50%) translateY(2px);
      }

      /* ── Sidekick (right pane) ── */
      .nf-sidekick {
        flex: 2 1 0;
        min-width: 0;
        height: 100%;
        border-left: 1px solid var(--nf-border);
        border-right: 1px solid var(--nf-border);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      /* ── Feed (middle pane) ── */
      .nf-feed {
        flex: 1 1 0;
        min-width: 0;
        height: 100%;
        overflow-y: auto;
        padding: 28px 24px;
        scrollbar-width: none;
        box-sizing: border-box;
      }
      .nf-feed::-webkit-scrollbar { display: none; }

      /* ── Cases Header ── */
      .nf-cases-header {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
      }

      .nf-cases-label {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 3px;
        color: var(--nf-accent);
      }

      /* ── Search Bar ── */
      .nf-search-container {
        margin-bottom: 24px;
        position: relative;
      }

      .nf-search-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid var(--nf-border);
        color: var(--nf-txt);
        font-family: var(--nf-font-mono);
        font-size: 0.85rem;
        padding: 12px 16px;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }

      .nf-search-input:focus {
        border-color: var(--nf-accent);
        background: rgba(255, 255, 255, 0.04);
        box-shadow: 0 0 8px rgba(186, 145, 112, 0.15);
      }

      .nf-search-input::placeholder {
        color: var(--nf-txt-dim);
        opacity: 0.4;
        font-style: italic;
      }

      .nf-no-cases {
        padding: 40px 0;
        text-align: center;
        font-family: var(--nf-font-mono);
        font-size: 0.85rem;
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-transform: uppercase;
        border-bottom: 1px solid var(--nf-border);
      }

      /* ── Cases ── */
      .nf-cases { padding-bottom: 48px; }

      .nf-case-list { display: flex; flex-direction: column; }

      .nf-case {
        padding: 20px 0;
        border-bottom: 1px solid var(--nf-border);
      }

      .nf-case-img {
        width: 100%;
        height: 140px;
        overflow: hidden;
        cursor: pointer;
        margin-bottom: 14px;
      }

      .nf-case-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        opacity: 0.75;
        transition: opacity 0.3s, filter 0.3s;
        filter: grayscale(30%);
      }

      .nf-case-img:hover img {
        opacity: 1;
        filter: grayscale(0%);
      }

      .nf-case-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }

      .nf-case-date {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        color: var(--nf-accent-dim);
        letter-spacing: 1px;
      }

      .nf-case-tag {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 1px;
        color: var(--nf-txt-dim);
        border: 1px solid var(--nf-border);
        padding: 2px 7px;
      }

      .nf-case-author {
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 1px;
        color: var(--nf-txt-dim);
      }

      .nf-case-title {
        font-family: var(--nf-font-display);
        font-size: clamp(1.1rem, 1.8vw, 1.4rem);
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--nf-txt);
        cursor: pointer;
        transition: color 0.2s;
        line-height: 1.3;
      }
      .nf-case-title:hover { color: var(--nf-accent); }

      .nf-case-excerpt {
        font-size: 1rem;
        line-height: 1.65;
        color: rgba(224,224,224,0.8);
        margin-bottom: 10px;
      }
      .nf-case-excerpt p { margin: 0 0 4px 0; }
      .nf-case-excerpt p:last-child { margin: 0; }

      .nf-case-read {
        background: none;
        border: none;
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--nf-accent-dim);
        cursor: pointer;
        padding: 0;
        transition: color 0.2s;
      }
      .nf-case-read:hover { color: var(--nf-accent); }

      /* ── Load more ── */
      .nf-load-more {
        display: block;
        width: 100%;
        margin-top: 28px;
        padding: 14px;
        background: none;
        border: 1px solid var(--nf-border);
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: var(--nf-txt-dim);
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        text-align: center;
      }
      .nf-load-more:hover {
        border-color: var(--nf-accent-dim);
        color: var(--nf-accent);
      }

      /* ── Footer ── */
      .nf-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 0 0;
        border-top: 1px solid var(--nf-border);
        font-family: var(--nf-font-mono);
        font-size: 0.75rem;
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-transform: uppercase;
      }

      /* ── Reveal animation ── */
      .reveal {
        opacity: 0;
        transform: translateY(14px);
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }

      ::selection { background: var(--nf-accent); color: var(--nf-bg); }

      /* ── Mobile ── */
      @media (max-width: 768px) {
        .nf-title-link {
          pointer-events: none;
          cursor: default;
        }
        .nf-shell {
          position: relative;
          inset: auto;
          flex-direction: column;
          height: auto;
          min-height: 100dvh;
          overflow: visible;
        }
        .nf-hero {
          flex: none;
          width: 100%;
          height: auto;
          border-right: none;
          border-bottom: 1px solid var(--nf-border);
          padding: 56px 24px 44px;
          align-items: flex-start;
        }
        .nf-feed {
          height: auto;
          overflow-y: visible;
          padding: 28px 20px 40px;
        }
        .nf-sidekick {
          flex: none;
          width: 100%;
          height: 100dvh;
          border-left: none;
          border-top: 1px solid var(--nf-border);
        }
        .nf-ctas { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        .nf-case-title { font-size: clamp(1.1rem, 5vw, 1.4rem); }
        .nf-case-img { height: 130px; }
      }

      @media (max-width: 480px) {
        .nf-hero { padding: 44px 18px 36px; }
        .nf-feed { padding: 28px 18px 40px; }
        .nf-ctas { flex-direction: column; }
        .nf-footer { flex-direction: column; gap: 8px; text-align: center; }
        .nf-sidekick { height: 100dvh; }
      }
    `}</style>
  );
}
