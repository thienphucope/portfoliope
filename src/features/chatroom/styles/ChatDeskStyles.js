export default function ChatDeskStyles() {
  return (
    <style jsx global>{`
      html, body { height: 100%; overflow: hidden; }

      .live-desk { position: fixed; inset: 0; }

      .live-shell {
        position: fixed;
        inset: 0;
        display: flex;
        flex-direction: column;
        background: var(--archive-paper-texture), var(--archive-paper);
        color: var(--md-colortext);
        font-family: var(--font-body);
      }

      .live-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--feature-header-top) var(--feature-space-right) var(--feature-header-bottom) var(--feature-space-left);
        border-bottom: 1px solid var(--archive-line-soft);
      }
      .live-overline {
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        letter-spacing: var(--ui-letter-section-header);
        font-weight: 700;
        color: var(--theme);
      }

      .live-stage {
        flex: 1;
        min-height: 0;
        width: 100%;
        max-width: 620px;
        margin: 0 auto;
        overflow-y: auto;
        scrollbar-width: none;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 26px;
        padding: 32px var(--feature-space-right);
        text-align: center;
      }
      .live-stage::-webkit-scrollbar { display: none; }

      .live-idle {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-style: italic;
        color: var(--archive-muted);
      }

      .live-status {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: var(--archive-muted);
      }
      .live-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: live-pulse 1.4s ease-in-out infinite; }
      .live-status--transcribing { color: var(--archive-ink); }
      .live-status--transcribing .live-dot { background: var(--archive-code-string); }
      .live-status--responding { color: var(--archive-accent); }

      .live-say {
        margin: 0;
        max-width: 100%;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.9rem);
        font-style: italic;
        line-height: 1.35;
        color: var(--archive-ink);
        overflow-wrap: anywhere;
      }
      .live-say--hint { font-size: 1.15rem; color: var(--archive-muted); }

      .live-reply {
        width: 100%;
        max-height: 34vh;
        overflow-y: auto;
        scrollbar-width: none;
        padding-top: 22px;
        border-top: 1px solid var(--archive-line-soft);
        text-align: left;
        color: var(--archive-muted);
        font-size: 0.95rem;
        line-height: 1.6;
      }
      .live-reply::-webkit-scrollbar { display: none; }

      .live-bar {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        width: 100%;
        max-width: 620px;
        margin: 0 auto;
        padding: 12px var(--feature-space-right) 16px var(--feature-space-left);
        border-top: 1px solid var(--archive-line-soft);
      }
      .live-hint { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--archive-muted); }

      .mic-btn, .end-btn, .start-call-btn {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        cursor: pointer;
        background: transparent;
        transition: color 0.25s, border-color 0.25s, background 0.25s;
      }
      .mic-btn {
        flex-shrink: 0;
        padding: 11px 22px;
        border: 1px solid var(--archive-ink);
        color: var(--archive-ink);
      }
      .mic-btn:hover { background: var(--archive-hover); }
      .mic-btn.listening { border-color: var(--archive-ink); color: var(--archive-paper); background: var(--archive-ink); }
      .mic-btn.holding { border-color: var(--accent); color: var(--accent); }
      .mic-btn.processing { border-color: var(--archive-danger); color: var(--archive-danger); animation: live-pulse 1.4s infinite; }
      .end-btn { border: 0; padding: 11px 8px; color: var(--archive-danger); }
      .end-btn:hover { text-decoration: underline; text-underline-offset: 4px; }

      .start-call-btn {
        width: 100%;
        padding: 15px;
        border: 1px solid var(--archive-ink);
        color: var(--archive-ink);
      }
      .start-call-btn:hover { background: var(--archive-ink); color: var(--archive-paper); }

      @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

      @media (max-width: 640px) {
        .live-say { font-size: 1.35rem; }
        .live-bar { flex-wrap: wrap; }
        .live-hint { flex: 1 1 100%; order: -1; text-align: center; }
      }
    `}</style>
  );
}
