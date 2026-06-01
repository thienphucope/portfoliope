export default function NoteFeedStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --nf-bg: #0a0a0c;
        --nf-txt: #e0e0e0;
        --nf-txt-dim: #aaaaaa;
        --nf-border: rgba(255,255,255,0.08);
        /* fonts: shared tokens in globals.css */
      }

      /* ── Shell ── */
      .nf-shell {
        position: fixed;
        inset: 0;
        display: flex;
        overflow: hidden;
        background: var(--nf-bg);
        color: var(--nf-txt);
        font-family: var(--font-body);
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
        font-size: 1.06rem;
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
  font-family: var(--font-display);
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

.nf-title-italic {
  font-style: italic;
  font-weight: 400;
  white-space: nowrap;
}

.nf-italic {
  font-style: italic;
  font-weight: 400;
  color: var(--theme);
  white-space: nowrap;
}

      .nf-social-divider {
        width: 80px;
        height: 2px;
        background: var(--theme);
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
      .nf-socials a:hover { color: var(--theme); }

      .nf-social-icon { font-size: 1.06rem; flex-shrink: 0; }

      .nf-social-label {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 1px;
      }

      .nf-social-desc {
        opacity: 0.65;
        font-size: 0.82rem;
      }

      .nf-hero-divider {
        width: 100%;
        height: 1px;
        background: var(--nf-border);
        margin-top: 32px;
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
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        font-weight: 700;
        letter-spacing: var(--ui-letter-section-header);
        color: var(--theme);
      }

      /* ── Search Bar ── */
      .nf-search-row {
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(186, 145, 112, 0.2);
        background: rgba(186, 145, 112, 0.02);
        padding: 12px 16px;
        transition: border-color 0.3s, background-color 0.3s;
        margin-bottom: 24px;
      }
      .nf-search-row:focus-within {
        border-color: var(--theme);
        background: rgba(186, 145, 112, 0.05);
      }

      .nf-search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--nf-txt);
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        font-weight: 400;
        letter-spacing: normal;
        padding: 4px 0;
        box-sizing: border-box;
      }

      .nf-search-btn {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        background: transparent;
        border: none;
        color: var(--theme);
        cursor: pointer;
        transition: color 0.3s;
        padding: 8px 4px;
        white-space: nowrap;
      }
      .nf-search-btn:hover:not(:disabled) {
        text-shadow: 0 0 10px rgba(186, 145, 112, 0.5);
      }
      .nf-search-btn:disabled { color: rgba(186, 145, 112, 0.3); cursor: default; }

      .nf-search-input::placeholder {
        color: currentColor;
        font-family: var(--font-mono);
        font-size: var(--ui-text-placeholder);
        font-weight: 400;
        letter-spacing: var(--ui-letter-placeholder);
        opacity: var(--ui-placeholder-opacity);
        font-style: normal;
      }

      .nf-no-cases {
        padding: 40px 0;
        text-align: center;
        font-family: var(--font-mono);
        font-size: 0.92rem;
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-transform: uppercase;
        border-bottom: 1px solid var(--nf-border);
      }

      /* ── Cases ── */
      .nf-cases { padding-bottom: 48px; }

      .nf-mobile-only { display: none !important; }
      .nf-case-list {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .nf-case {
        padding: 20px 0;
        border-bottom: 1px solid var(--nf-border);
      }

      .nf-case-img {
        width: 100%;
        height: auto;
        overflow: visible;
        cursor: pointer;
        margin-bottom: 14px;
      }

      .nf-case-img img {
        width: 100%;
        height: auto;
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
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: var(--theme);
        letter-spacing: 1px;
      }

      .nf-case-tag {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 1px;
        color: var(--nf-txt-dim);
        border: 1px solid var(--nf-border);
        padding: 2px 7px;
      }

      .nf-case-author {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 1px;
        color: var(--nf-txt-dim);
      }

      .nf-case-title {
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--nf-txt);
        cursor: pointer;
        transition: color 0.2s;
        line-height: 1.3;
      }
      .nf-case-title:hover { color: var(--theme); }

      .nf-case-excerpt {
        font-size: var(--ui-text-body);
        line-height: 1.65;
        color: rgba(224,224,224,0.8);
        margin-bottom: 10px;
      }
      .nf-case-excerpt p { margin: 0 0 4px 0; }
      .nf-case-excerpt p:last-child { margin: 0; }

      .nf-case-read {
        background: none;
        border: none;
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        color: var(--theme);
        cursor: pointer;
        padding: 0;
        transition: color 0.2s;
      }
      .nf-case-read:hover { color: var(--theme); }

      /* ── Load more ── */
      .nf-load-more {
        display: block;
        width: 100%;
        margin-top: 28px;
        padding: 14px;
        background: none;
        border: 1px solid var(--nf-border);
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        color: var(--nf-txt-dim);
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
        text-align: center;
      }
      .nf-load-more:hover {
        border-color: var(--theme);
        color: var(--theme);
      }

      /* ── Footer ── */
      .nf-footer {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 24px 0 0;
        border-top: 1px solid var(--nf-border);
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-align: center;
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

      ::selection { background: var(--theme); color: var(--nf-bg); }

      .nf-desktop-only { display: block; height: 100%; width: 100%; }
      .nf-mobile-only { display: none !important; }
      .nf-block-ref-link {
        display: block;
        padding: 16px;
        background: rgba(186,145,112,0.05);
        border: 1px dashed var(--nf-border);
        color: var(--theme);
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        font-weight: 700;
        letter-spacing: var(--ui-letter-section-header);
        text-align: center;
        text-decoration: none;
        transition: border-color 0.2s, background 0.2s;
        margin-top: 16px;
      }
      .nf-block-ref-link:hover {
        border-color: var(--theme);
        background: rgba(186,145,112,0.1);
      }

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
          padding: 56px 24px 16px;
          align-items: flex-start;
        }
        .nf-hero-divider { display: none; }
        .nf-feed {
          height: auto;
          overflow-y: visible;
          padding: 28px 20px 40px;
        }
        .nf-sidekick {
          flex: none;
          width: 100%;
          height: auto;
          padding: 0 24px 24px;
          border-left: none;
          border-top: none;
        }
        .nf-desktop-only { display: none !important; }
        .nf-mobile-only { display: block !important; }
        .nf-ctas { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        .nf-case-title { font-size: var(--ui-text-title-mobile); }
      }

      @media (max-width: 480px) {
        .nf-hero { padding: 44px 18px 16px; }
        .nf-feed { padding: 28px 18px 40px; }
        .nf-ctas { flex-direction: column; }
        .nf-footer { flex-direction: column; gap: 8px; text-align: center; }
        .nf-sidekick { height: auto; }
      }
    `}</style>
  );
}
