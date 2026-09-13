export default function ChatDeskStyles() {
  return (
    <style jsx global>{`
      .live-desk { display: flex; flex: 1; min-height: 0; }
      .live-shell { display: flex; flex: 1; flex-direction: column; min-height: 0; width: 100%; max-width: 820px; margin: 0 auto; padding: 0 28px; color: var(--archive-ink); font-family: var(--archive-font-ui); }
      .live-heading { flex-shrink: 0; padding: 32px 0 24px; border-bottom: 1px solid var(--archive-line-soft); }
      .live-heading > span { display: block; margin-bottom: 10px; color: var(--archive-muted); font-family: var(--archive-font-code); font-size: .625rem; letter-spacing: .16em; text-transform: uppercase; }
      .live-heading h1 { margin: 0; font-family: var(--archive-font-reading); font-size: clamp(1.5rem, 2.6vw, 2rem); line-height: 1.35; font-weight: 400; letter-spacing: -.025em; }
      .live-heading > p { margin: 9px 0 0; color: var(--archive-muted); font-size: .8125rem; line-height: 1.6; }
      .live-stage { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: safe center; min-height: 0; gap: 24px; padding: 32px 0; overflow-y: auto; overscroll-behavior: contain; text-align: center; }
      .live-idle { display: flex; flex-direction: column; align-items: center; max-width: 360px; color: var(--archive-muted); }
      .live-idle > svg { margin-bottom: 20px; color: var(--archive-accent); }
      .live-idle p { margin: 0 0 10px; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: 1.5rem; line-height: 1.45; letter-spacing: -.02em; }
      .live-idle span { font-size: .8125rem; line-height: 1.7; }
      .live-status { display: inline-flex; align-items: center; gap: 9px; color: var(--archive-muted); font-size: .75rem; }
      .live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: live-pulse 1.4s ease-in-out infinite; }
      .live-status--transcribing { color: var(--archive-code-string); }
      .live-status--responding { color: var(--archive-accent); }
      .live-say { margin: 0; max-width: 100%; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: clamp(1.125rem, 2vw, 1.5rem); line-height: 1.65; overflow-wrap: anywhere; }
      .live-say--hint { color: var(--archive-muted); font-size: 1rem; }
      .live-reply { width: 100%; max-height: 34dvh; overflow-y: auto; padding-top: 22px; border-top: 1px solid var(--archive-line-soft); text-align: left; }
      .live-reply .bubble-content.markdown-content { color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: 1rem; line-height: 1.75; text-align: left; }
      .live-reply .markdown-content :is(h1, h2, h3, h4, h5, h6) { color: var(--archive-ink); line-height: 1.45; }
      .live-reply .markdown-content a { color: var(--archive-accent); }
      .live-reply .markdown-content :is(th, td) { color: var(--archive-ink); border-color: var(--archive-line-soft); }
      .live-reply .markdown-content th, .live-reply .code-block { background: var(--archive-surface); border-color: var(--archive-line-soft); }
      .live-reply .markdown-content p br { display: revert; margin: 0; }
      .live-bar { display: flex; flex-shrink: 0; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; padding: 20px 0 max(24px, env(safe-area-inset-bottom)); border-top: 1px solid var(--archive-line-soft); }
      .live-hint { flex: 1; color: var(--archive-muted); font-size: .6875rem; line-height: 1.6; }
      .live-bar :is(.mic-btn, .end-btn, .start-call-btn) { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; padding: 10px 16px; border: 1px solid var(--archive-line-soft); border-radius: 3px; background: transparent; color: var(--archive-ink); font-family: var(--archive-font-ui); font-size: .8125rem; line-height: 1.4; cursor: pointer; transition: background 180ms, color 180ms; }
      .live-bar .start-call-btn { min-width: 180px; background: var(--archive-ink); color: var(--archive-paper); border-color: var(--archive-ink); }
      .live-bar .start-call-btn:hover { background: var(--archive-accent); border-color: var(--archive-accent); }
      .live-bar .mic-btn:hover { background: var(--archive-hover); }
      .live-bar .mic-btn.listening { background: var(--archive-ink); color: var(--archive-paper); }
      .live-bar .mic-btn.holding { color: var(--archive-accent); background: var(--archive-surface); }
      .live-bar .mic-btn.processing { color: var(--archive-danger); animation: live-pulse 1.4s infinite; }
      .live-bar .end-btn { color: var(--archive-danger); border-color: transparent; }
      .live-bar .end-btn:hover { background: var(--archive-hover); }
      @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
      @media (max-width: 639px) {
        .live-shell { padding: 0 20px; }
        .live-heading { padding: 24px 0 18px; }
        .live-hint { flex: 1 1 100%; text-align: center; }
        .live-idle p { font-size: 1.25rem; }
      }
      @media (prefers-reduced-motion: reduce) { .live-dot, .live-bar .mic-btn.processing { animation: none; } }
    `}</style>
  );
}
