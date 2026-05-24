export default function NoteFeedStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --nf-bg: #0a0a0c;
        --nf-txt: #e0e0e0;
        --nf-txt-dim: #888888;
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
        overflow: hidden;
        box-sizing: border-box;
      }

      .nf-hero-content {
        display: flex;
        flex-direction: column;
        gap: 28px;
        width: 100%;
        max-width: 100%;
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
        width: 40px;
        height: 1px;
        background: var(--nf-accent-dim);
        margin: 12px auto;
        opacity: 0.4;
      }

      .nf-socials {
        display: flex;
        justify-content: center;
        gap: 24px;
        font-size: 1.4rem;
      }

      .nf-socials a {
        color: var(--nf-txt-dim);
        transition: color 0.2s;
        text-decoration: none;
        display: flex;
        align-items: center;
      }

      .nf-socials a:hover { color: var(--nf-accent); }

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
        font-size: 0.6rem;
        color: var(--nf-accent-dim);
        letter-spacing: 1px;
      }

      .nf-case-tag {
        font-family: var(--nf-font-mono);
        font-size: 0.6rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--nf-txt-dim);
        border: 1px solid var(--nf-border);
        padding: 2px 7px;
      }

      .nf-case-author {
        font-family: var(--nf-font-mono);
        font-size: 0.6rem;
        letter-spacing: 1px;
        color: var(--nf-txt-dim);
        opacity: 0.7;
      }

      .nf-case-title {
        font-family: var(--nf-font-display);
        font-size: clamp(1rem, 1.8vw, 1.3rem);
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--nf-txt);
        cursor: pointer;
        transition: color 0.2s;
        line-height: 1.3;
      }
      .nf-case-title:hover { color: var(--nf-accent); }

      .nf-case-excerpt {
        font-size: 0.9rem;
        line-height: 1.65;
        color: rgba(224,224,224,0.55);
        margin-bottom: 10px;
      }
      .nf-case-excerpt p { margin: 0 0 4px 0; }
      .nf-case-excerpt p:last-child { margin: 0; }

      .nf-case-read {
        background: none;
        border: none;
        font-family: var(--nf-font-mono);
        font-size: 0.6rem;
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
        font-size: 0.6rem;
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
        font-size: 0.6rem;
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
          height: 480px;
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
        .nf-sidekick { height: 420px; }
      }
    `}</style>
  );
}
