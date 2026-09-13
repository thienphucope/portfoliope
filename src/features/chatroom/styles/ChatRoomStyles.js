export default function ChatRoomStyles() {
  return (
    <style jsx global>{`
      .chat-shell { --font-body: var(--archive-font-reading); display: flex; flex-direction: column; position: relative; flex: 1; width: 100%; height: 100%; min-width: 0; min-height: 0; color: var(--archive-ink); background: transparent; font-family: var(--archive-font-ui); }
      .chat-shell .chat-header { display: flex; align-items: flex-end; justify-content: space-between; flex-shrink: 0; gap: 20px; width: 100%; max-width: 820px; margin: 0 auto; padding: 32px 28px 24px; border-bottom: 1px solid var(--archive-line-soft); }
      .chat-shell .header-copy { min-width: 0; }
      .chat-shell .chat-eyebrow { display: block; margin-bottom: 10px; color: var(--archive-muted); font-family: var(--archive-font-code); font-size: .625rem; letter-spacing: .16em; text-transform: uppercase; }
      .chat-shell .chat-overline { margin: 0; color: var(--archive-ink); font-family: var(--archive-font-reading); font-size: clamp(1.5rem, 2.6vw, 2rem); line-height: 1.35; font-weight: 400; letter-spacing: -.025em; }
      .chat-shell .chat-description { margin: 9px 0 0; color: var(--archive-muted); font-size: .8125rem; line-height: 1.6; }
      .chat-shell .chat-note-context { display: flex; align-items: center; gap: 7px; min-width: 0; margin: 9px 0 0; color: var(--archive-accent); font-size: .75rem; line-height: 1.6; }
      .chat-shell .chat-note-context svg { flex-shrink: 0; }
      .chat-shell .chat-note-context span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chat-shell .chat-status { display: inline-flex; align-items: center; flex-shrink: 0; gap: 7px; padding-bottom: 3px; color: var(--archive-muted); font-size: .6875rem; }
      .chat-shell .chat-status i { width: 5px; height: 5px; border-radius: 50%; background: var(--archive-accent); }
      .chat-shell .messages-area { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
      .chat-shell .messages-list { display: flex; flex: 1; flex-direction: column; gap: 28px; width: 100%; max-width: 820px; margin: 0 auto; padding: 30px 28px; overflow-y: auto; overscroll-behavior: contain; }
      .chat-shell .chat-response, .chat-shell .history-entry { flex-shrink: 0; min-width: 0; }
      .chat-shell .history-entry { padding-bottom: 24px; border-bottom: 1px solid var(--archive-line-soft); }
      .chat-shell .bubble-content.markdown-content { padding: 0; border: 0; font-family: var(--archive-font-reading); font-size: 1rem; line-height: 1.75; color: var(--archive-ink); text-align: left; letter-spacing: normal; word-spacing: normal; overflow-wrap: anywhere; }
      .chat-shell .history-entry .bubble-content { color: var(--archive-muted); opacity: 1; }
      .chat-shell .bubble-content p { margin: 0 0 1em; }
      .chat-shell .bubble-content p:last-child { margin-bottom: 0; }
      .chat-shell .bubble-content p br { display: revert; margin: 0; }
      .chat-shell .bubble-content :is(h1, h2, h3, h4, h5, h6) { color: var(--archive-ink); font-family: var(--archive-font-reading); line-height: 1.45; letter-spacing: normal; }
      .chat-shell .bubble-content h1 { font-size: 1.4em; }
      .chat-shell .bubble-content h2 { font-size: 1.25em; }
      .chat-shell .bubble-content :is(h3, h4, h5, h6) { font-size: 1.1em; }
      .chat-shell .bubble-content :is(a, .internal-link) { color: var(--archive-accent); border-bottom-color: var(--archive-line-soft); }
      .chat-shell .bubble-content code { font-family: var(--archive-font-code); font-size: .85em; }
      .chat-shell .bubble-content :not(pre) > code { padding: 2px 4px; background: var(--archive-surface); }
      .chat-shell .bubble-content .code-block { border: 1px solid var(--archive-line-soft); background: var(--archive-surface); }
      .chat-shell .bubble-content .code-block pre { padding: 14px; font-size: .8125rem; line-height: 1.6; }
      .chat-shell .bubble-content .hljs { color: var(--archive-ink); background: transparent; }
      .chat-shell .bubble-content :is(.hljs-comment, .hljs-quote) { color: var(--archive-muted); }
      .chat-shell .bubble-content :is(.hljs-keyword, .hljs-built_in, .hljs-title) { color: var(--archive-accent); }
      .chat-shell .bubble-content :is(.hljs-string, .hljs-attr) { color: var(--archive-code-string); }
      .chat-shell .bubble-content blockquote { margin: 1em 0; padding-left: 16px; border-left: 1px solid var(--archive-line); color: var(--archive-muted); opacity: 1; }
      .chat-shell .bubble-content li { line-height: 1.75; }
      .chat-shell .bubble-content .table-container { border-color: var(--archive-line-soft); background: transparent; }
      .chat-shell .bubble-content :is(th, td) { border-bottom-color: var(--archive-line-soft); color: var(--archive-ink); font-family: var(--archive-font-ui); font-size: .8125rem; }
      .chat-shell .bubble-content th { background: var(--archive-surface); }
      .chat-shell .suggest-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
      .chat-shell .suggest-btn { min-height: 40px; padding: 9px 12px; border: 1px solid var(--archive-line-soft); border-radius: 3px; background: transparent; color: var(--archive-muted); font-family: var(--archive-font-ui); font-size: .8125rem; line-height: 1.5; text-align: left; cursor: pointer; transition: background 180ms, border-color 180ms; }
      .chat-shell .suggest-btn:hover { background: var(--archive-hover); border-color: var(--archive-accent); color: var(--archive-ink); }
      .chat-shell .chat-tool-calls { display: grid; gap: 5px; margin-bottom: 14px; padding-left: 12px; border-left: 1px solid var(--archive-line-soft); color: var(--archive-muted); font-family: var(--archive-font-code); font-size: .6875rem; line-height: 1.6; overflow-wrap: anywhere; }
      .chat-shell .live-transcription { margin-top: 16px; color: var(--archive-muted); font-size: .875rem; line-height: 1.6; font-style: italic; }
      .chat-shell .streaming-cursor { display: inline-block; width: 2px; height: 1em; margin-left: 4px; background: var(--archive-accent); vertical-align: middle; animation: chat-blink 1s ease-in-out infinite; }
      .chat-shell .thinking-dots { color: var(--archive-muted); letter-spacing: 3px; animation: chat-blink 1.5s ease-in-out infinite; }
      .chat-shell .input-area { flex-shrink: 0; width: 100%; max-width: 820px; margin: 0 auto; padding: 12px 28px max(20px, env(safe-area-inset-bottom)); background: transparent; }
      .chat-shell .textarea-row { display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--archive-line-soft); border-radius: 4px; background: #ffffff26; transition: border-color 180ms; }
      .chat-shell .textarea-row:focus-within { border-color: var(--archive-accent); }
      .chat-shell .chat-input { display: block; flex: 1; width: 100%; min-width: 0; min-height: 48px; max-height: 120px; padding: 0; margin: 0; resize: none; overflow-y: auto; border: 0; outline: none; background: transparent; color: var(--archive-ink); font-family: var(--archive-font-ui); font-size: 1rem; line-height: 1.65; letter-spacing: normal; }
      .chat-shell .chat-input:focus-visible { outline: none; }
      .chat-shell .chat-input::placeholder { color: var(--archive-muted); opacity: .85; font: inherit; }
      .chat-shell .chat-input:disabled { opacity: .5; }
      .chat-shell .textarea-actions { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 8px; }
      .chat-shell .action-btn { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 3px; background: transparent; color: var(--archive-muted); cursor: pointer; transition: color 180ms, background 180ms; }
      .chat-shell .action-btn:hover:not(:disabled) { background: var(--archive-hover); color: var(--archive-ink); }
      .chat-shell .action-btn.send-btn { background: var(--archive-ink); color: var(--archive-paper); }
      .chat-shell .action-btn.send-btn:hover:not(:disabled) { background: var(--archive-accent); color: var(--archive-paper); }
      .chat-shell .action-btn:disabled { cursor: default; opacity: .35; }
      .chat-shell .composer-note { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; color: var(--archive-muted); font-size: .6875rem; line-height: 1.5; }
      .chat-shell .live-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 16px; border: 1px solid var(--archive-line-soft); border-radius: 4px; }
      .chat-shell .live-copy { display: grid; flex: 1 1 160px; gap: 5px; }
      .chat-shell .live-title { color: var(--archive-ink); font-size: .875rem; }
      .chat-shell .live-subtitle { color: var(--archive-muted); font-size: .6875rem; }
      .chat-shell .mic-btn, .chat-shell .end-btn { min-height: 40px; padding: 8px 10px; border: 1px solid var(--archive-line-soft); border-radius: 3px; background: transparent; color: var(--archive-ink); font-family: var(--archive-font-ui); font-size: .8125rem; cursor: pointer; }
      .chat-shell .mic-btn.listening, .chat-shell .mic-btn.holding { background: var(--archive-surface); color: var(--archive-accent); }
      .chat-shell .mic-btn.processing { animation: chat-blink 1.5s infinite; }
      .chat-shell .end-btn { color: var(--archive-danger); border-color: transparent; }
      .chat-shell .end-btn:hover { background: var(--archive-hover); }
      .chat-shell .chat-spinner { animation: chat-spin 1s linear infinite; }
      .chat-shell--embedded .chat-header { padding: 22px 20px 18px; }
      .chat-shell--embedded .chat-overline { font-size: 1.35rem; }
      .chat-shell--embedded .chat-status { display: none; }
      .chat-shell--embedded .messages-list { padding: 22px 20px; }
      .chat-shell--embedded .input-area { padding: 12px 20px 16px; }
      .chat-shell--embedded .composer-note > :last-child { display: none; }
      @keyframes chat-blink { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
      @keyframes chat-spin { to { transform: rotate(360deg); } }
      @media (max-width: 639px) {
        .chat-shell .chat-header { padding: 24px 20px 18px; }
        .chat-shell .chat-status { display: none; }
        .chat-shell .messages-list { padding: 24px 20px; }
        .chat-shell .input-area { padding: 10px 20px max(16px, env(safe-area-inset-bottom)); }
        .chat-shell .composer-note > :last-child { display: none; }
        .chat-shell--embedded .chat-header { padding: 14px 16px; }
        .chat-shell--embedded .chat-eyebrow, .chat-shell--embedded .chat-description { display: none; }
        .chat-shell--embedded .messages-list { padding: 16px; }
        .chat-shell--embedded .input-area { padding: 8px 16px; }
        .chat-shell--embedded .chat-input { min-height: 28px; }
        .chat-shell--embedded .textarea-row { gap: 4px; padding: 10px; }
        .chat-shell--embedded .composer-note { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        .chat-shell .streaming-cursor, .chat-shell .thinking-dots, .chat-shell .mic-btn.processing, .chat-shell .chat-spinner { animation: none; }
      }
    `}</style>
  );
}
