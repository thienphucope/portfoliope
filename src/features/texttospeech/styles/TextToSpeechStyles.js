export default function TextToSpeechStyles() {
  return (
    <style jsx global>{`
      .voice-route { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--archive-paper-texture), var(--archive-paper); color: var(--archive-ink); }
      .voice-route-inner { display: flex; flex: 1; flex-direction: column; min-height: 0; width: 100%; max-width: 820px; margin: 0 auto; padding: 0 28px; }
      .nf-tts-section { display: flex; flex: 1; flex-direction: column; width: 100%; height: 100%; min-height: 0; color: var(--archive-ink); font-family: var(--archive-font-ui); }
      .nf-tts-header { flex-shrink: 0; padding: 32px 0 24px; border-bottom: 1px solid var(--archive-line-soft); }
      .nf-tts-label { display: block; margin-bottom: 10px; color: var(--archive-muted); font-family: var(--archive-font-code); font-size: .625rem; letter-spacing: .16em; text-transform: uppercase; }
      .nf-tts-header h1 { margin: 0; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: clamp(1.5rem, 2.6vw, 2rem); line-height: 1.35; font-weight: 400; letter-spacing: -.025em; }
      .nf-tts-header > p { margin: 9px 0 0; color: var(--archive-muted); font-size: .8125rem; line-height: 1.6; }
      .nf-tts-history-area { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
      .nf-tts-history { display: flex; flex-direction: column; padding: 4px 0 16px; }
      .nf-tts-history-item { display: flex; flex-direction: column; gap: 12px; padding: 24px 0; border-bottom: 1px solid var(--archive-line-soft); }
      .nf-tts-history-item:last-child { border-bottom: 0; }
      .nf-tts-take { display: flex; align-items: center; justify-content: space-between; gap: 16px; color: var(--archive-muted); font-family: var(--archive-font-code); font-size: .625rem; letter-spacing: .12em; text-transform: uppercase; }
      .nf-tts-history-text { margin: 0; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: 1rem; line-height: 1.75; overflow-wrap: anywhere; }
      .nf-tts-section .nf-tts-audio { margin: 0; }
      .nf-tts-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; padding: 32px 16px; color: var(--archive-muted); text-align: center; }
      .nf-tts-empty > svg { flex-shrink: 0; margin-bottom: 20px; color: var(--archive-accent); }
      .nf-tts-empty p { margin: 0 0 10px; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: 1.5rem; line-height: 1.45; letter-spacing: -.02em; }
      .nf-tts-empty span { max-width: 320px; font-size: .8125rem; line-height: 1.7; }
      .nf-tts-composer { display: flex; flex-shrink: 0; flex-direction: column; gap: 10px; padding: 12px 0 max(20px, env(safe-area-inset-bottom)); }
      .nf-tts-textarea-row { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--archive-line-soft); border-radius: 4px; background: #ffffff26; transition: border-color 180ms; }
      .nf-tts-textarea-row:focus-within { border-color: var(--archive-accent); }
      .nf-tts-input-label { color: var(--archive-muted); font-size: .6875rem; }
      .nf-tts-input { display: block; width: 100%; min-width: 0; min-height: 80px; max-height: 120px; padding: 0; margin: 0; resize: none; overflow-y: auto; border: 0; outline: none; background: transparent; color: var(--archive-ink); font-family: var(--archive-font-ui); font-size: 1rem; line-height: 1.65; letter-spacing: normal; }
      .nf-tts-input:focus-visible { outline: none; }
      .nf-tts-input::placeholder { color: var(--archive-muted); opacity: .85; font: inherit; }
      .nf-tts-input:disabled { opacity: .5; }
      .nf-tts-actions { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .nf-tts-count { color: var(--archive-muted); font-size: .6875rem; font-variant-numeric: tabular-nums; }
      .nf-tts-btn { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; gap: 9px; min-height: 40px; padding: 10px 14px; border: 0; border-radius: 3px; background: var(--archive-ink); color: var(--archive-paper); font-family: var(--archive-font-ui); font-size: .8125rem; line-height: 1.4; cursor: pointer; transition: background 180ms; }
      .nf-tts-btn:hover:not(:disabled) { background: var(--archive-accent); }
      .nf-tts-btn:disabled { cursor: default; opacity: .4; }
      .nf-tts-composer-note { min-height: 17px; color: var(--archive-muted); font-size: .6875rem; line-height: 1.5; }
      .nf-tts-error { margin: 0; padding: 12px 14px; border-left: 2px solid var(--archive-danger); background: var(--archive-surface); color: var(--archive-danger); font-size: .8125rem; line-height: 1.6; }
      .nf-tts-spinner { animation: tts-spin 1s linear infinite; }
      @keyframes tts-spin { to { transform: rotate(360deg); } }
      @media (max-width: 639px) {
        .voice-route-inner { padding: 0 20px; }
        .nf-tts-header { padding: 24px 0 18px; }
        .nf-tts-empty { padding: 24px 8px; }
        .nf-tts-empty p { font-size: 1.25rem; }
        .nf-tts-textarea-row { padding: 14px; }
        .nf-tts-composer { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
      }
      @media (max-height: 640px) {
        .nf-tts-header { padding: 18px 0 14px; }
        .nf-tts-header > p { display: none; }
        .nf-tts-empty { padding: 16px 8px; }
        .nf-tts-empty > svg { display: none; }
        .nf-tts-input { min-height: 52px; }
      }
      @media (prefers-reduced-motion: reduce) { .nf-tts-spinner { animation: none; } }
    `}</style>
  );
}
