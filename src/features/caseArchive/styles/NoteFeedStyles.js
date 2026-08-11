export default function NoteFeedStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --nf-bg: #000;
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
  gap: 0.18em;
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
        font-size: var(--ui-text-body);
        letter-spacing: 1px;
      }

      .nf-social-desc {
        opacity: 0.65;
        font-size: var(--ui-text-body);
      }

      .nf-feature-refs {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .nf-feature-ref-slot {
        display: block;
      }

      .nf-feature-ref {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border: 1px solid var(--nf-border);
        background: rgba(186,145,112,0.02);
        color: var(--nf-txt-dim);
        font-family: var(--font-mono);
        text-align: left;
        text-decoration: none;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s, color 0.2s;
        box-sizing: border-box;
      }

      .nf-feature-ref:hover,
      .nf-feature-ref.is-active {
        border-color: rgba(186,145,112,0.45);
        background: rgba(186,145,112,0.06);
        color: var(--theme);
      }

      .nf-feature-ref-icon {
        flex-shrink: 0;
        font-size: 1.06rem;
      }

      .nf-feature-ref-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .nf-feature-ref-label {
        font-size: var(--ui-text-body);
        letter-spacing: 1px;
      }

      .nf-feature-ref-desc {
        font-size: var(--ui-text-body);
        opacity: 0.65;
      }

      .nf-feature-ref-mobile {
        display: none;
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

      .nf-feature-panel {
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .nf-feature-panel-slot {
        display: none;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .nf-feature-panel-slot.is-active {
        display: block;
      }

      .nf-feature-panel-fill {
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .nf-feature-panel-body {
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow-y: auto;
        padding: var(--feature-space);
        box-sizing: border-box;
        scrollbar-width: none;
      }
      .nf-feature-panel-body::-webkit-scrollbar { display: none; }

      /* ── Feed (middle pane) ── */
      .nf-feed {
        position: relative;
        flex: 1 1 0;
        min-width: 0;
        height: 100%;
        overflow-y: auto;
        padding: var(--feature-space);
        scrollbar-width: none;
        box-sizing: border-box;
        background: var(--scene-falloff), var(--nf-bg);
        background-size: 100% 100dvh;
        background-repeat: no-repeat;
        background-attachment: local;
      }
      .nf-feed::-webkit-scrollbar { display: none; }

      /* ── Cases Header ── */
      .nf-cases-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        align-items: end;
        gap: 12px 18px;
        margin: 0 0 clamp(18px, 3vw, 30px);
        padding: 0;
        border-bottom: none;
        box-sizing: border-box;
      }

      .nf-cases-label {
        font-family: var(--font-body);
        font-size: clamp(3.2rem, 10vw, 7.4rem);
        font-weight: 900;
        line-height: 0.95;
        letter-spacing: -0.01em;
        color: var(--theme);
      }

      .nf-cases-header .nf-discuss-links {
        display: none;
      }

      @media (min-width: 1024px) {
        .nf-cases-header {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
        }

        .nf-cases-header .nf-discuss-links {
          display: flex;
          grid-area: auto;
          justify-self: end;
          align-self: center;
          justify-content: flex-start;
          gap: 16px;
          padding-bottom: 0;
        }

        .nf-cases-header .nf-discuss-links .about-nav {
          gap: 18px;
        }

        .nf-cases-header .nf-discuss-links .about-social-prompt {
          color: var(--nf-txt-dim);
        }

        .nf-cases-header .nf-discuss-links .title-fly-out {
          max-width: 22vw;
        }
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
        font-size: var(--ui-text-placeholder);
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-transform: uppercase;
        border-bottom: 1px solid var(--nf-border);
      }

      /* ── Cases ── */
      .nf-cases { padding-bottom: 48px; }

      .nf-case-list {
        min-height: 55vh;
      }

      .nf-case-list.is-masonry {
        column-count: 1;
        column-gap: clamp(14px, 2.4vw, 26px);
      }

      .nf-case-list.is-empty {
        display: block;
      }

      .nf-case {
        display: inline-block;
        width: 100%;
        break-inside: avoid;
        page-break-inside: avoid;
        margin: 0 0 clamp(14px, 2.4vw, 26px);
        padding: clamp(10px, 1.2vw, 14px) clamp(10px, 1.2vw, 14px) clamp(16px, 1.8vw, 24px);
        border: 1px solid rgba(243, 208, 152, 0.24);
        border-radius: 2px;
        background:
          linear-gradient(180deg, rgba(174, 226, 218, 0.07), rgba(61, 107, 106, 0.03)),
          rgba(9, 16, 18, 0.82);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.05),
          0 18px 34px -24px rgba(0, 0, 0, 0.95);
        color: var(--nf-txt);
        transition: transform 0.24s ease, box-shadow 0.24s ease;
      }

      .nf-case:hover {
        border-color: rgba(243, 208, 152, 0.48);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.08),
          0 24px 44px -24px rgba(0, 0, 0, 1);
        transform: translateY(-3px);
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
        border: 1px solid rgba(243, 208, 152, 0.18);
        background: rgba(255, 255, 255, 0.04);
        opacity: 0.82;
        transition: opacity 0.3s, filter 0.3s;
        filter: grayscale(28%);
      }

      .nf-case-img:hover img,
      .nf-case:hover .nf-case-img img {
        opacity: 1;
        filter: grayscale(0%);
      }

      .nf-case-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 9px;
        flex-wrap: wrap;
      }

      .nf-case-date {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        color: var(--theme);
        letter-spacing: 1px;
      }

      .nf-case-tag {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        letter-spacing: 1px;
        color: rgba(224,224,224,0.72);
        border: 1px solid rgba(243, 208, 152, 0.2);
        padding: 2px 7px;
      }

      .nf-case-author {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        letter-spacing: 1px;
        color: rgba(224,224,224,0.64);
      }

      .nf-case-title {
        font-family: var(--font-display);
        font-size: clamp(1.25rem, 2.1vw, 1.7rem);
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--nf-txt);
        cursor: pointer;
        transition: color 0.2s;
        line-height: 1.18;
      }
      .nf-case-title:hover { color: var(--theme); }

      .nf-case-excerpt,
      .nf-feed .nf-case-excerpt.markdown-content {
        font-size: var(--ui-text-body);
        line-height: 1.55;
        color: rgba(224,224,224,0.78);
        margin-bottom: 12px;
        text-align: left;
      }
      .nf-case-excerpt p,
      .nf-feed .nf-case-excerpt.markdown-content p { margin: 0 0 4px 0; }
      .nf-case-excerpt p:last-child,
      .nf-feed .nf-case-excerpt.markdown-content p:last-child { margin: 0; }

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
      .nf-case-read:hover {
        color: #fff;
        text-shadow: 0 0 10px rgba(243, 208, 152, 0.42);
      }

      @media (min-width: 640px) {
        .nf-case-list.is-masonry {
          column-count: 2;
        }
      }

      @media (min-width: 1080px) {
        .nf-case-list.is-masonry {
          column-count: 3;
        }
      }

      @media (min-width: 1500px) {
        .nf-case-list.is-masonry {
          column-count: 4;
        }
      }

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
        font-size: var(--ui-text-body);
        letter-spacing: 2px;
        color: var(--nf-txt-dim);
        text-align: center;
      }

      .nf-legal-links {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        /* above the LampScene shade (45): it lands at the viewport bottom, where
           the ramp is solid black */
        position: relative;
        z-index: 46;
        font-family: var(--font-mono);
        font-size: var(--ui-text-body);
        letter-spacing: 1px;
      }
      .nf-legal-links a {
        color: var(--nf-txt-dim);
        text-decoration: none;
        transition: color 0.2s;
      }
      .nf-legal-links a:hover { color: var(--theme); }
      .nf-legal-sep { color: var(--nf-txt-dim); opacity: 0.5; }

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
      .nf-case.reveal {
        transform: translateY(14px);
        transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.24s ease;
      }
      .nf-case.reveal.visible {
        transform: translateY(0);
      }
      .nf-case.reveal.visible:hover {
        transform: translateY(-3px);
      }

      ::selection { background: var(--theme); color: var(--nf-bg); }

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
          padding: var(--feature-space);
        }
        .nf-sidekick {
          display: none;
        }
        .nf-feature-ref-desktop { display: none; }
        .nf-feature-ref-mobile { display: flex; }
        .nf-ctas { flex-direction: row; flex-wrap: wrap; gap: 10px; }
        .nf-case-title { font-size: var(--ui-text-title-mobile); }
      }

      @media (max-width: 480px) {
        .nf-hero { padding: 44px 18px 16px; }
        .nf-feed { padding: var(--feature-space); }
        .nf-ctas { flex-direction: column; }
        .nf-footer { flex-direction: column; gap: 8px; text-align: center; }
        .nf-sidekick { height: auto; }
      }
    `}</style>
  );
}
