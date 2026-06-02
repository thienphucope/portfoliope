export default function ChatRoomStyles({ isEmbedded }) {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --void: #0a0a0c;
        --colorone-dim: #8a6b52;
        --parchment: #f4e8c1;
        --parchment-dark: #c4b48a;
        /* fonts: shared tokens in globals.css */
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      ${!isEmbedded ? 'html, body { height: 100%; background: var(--void); overflow: hidden; }' : ''}

      .chat-shell {
        position: fixed;
        inset: 0;
        height: 100dvh;
        background: var(--void);
        background-image:
          radial-gradient(circle at 10% 20%, rgba(186, 145, 112, 0.05), transparent 40rem),
          repeating-linear-gradient(0deg, rgba(186, 145, 112, 0.02) 0, rgba(186, 145, 112, 0.02) 1px, transparent 1px, transparent 3px);
        color: var(--parchment);
        font-family: var(--font-body);
        display: flex;
        flex-direction: column;
      }
      ${isEmbedded ? '.chat-shell { position: relative; flex: 1; min-height: 0; background: #0a0a0c; background-image: none; }' : ''}

      .chat-shell::after {
        content: "";
        position: ${isEmbedded ? 'absolute' : 'fixed'};
        inset: 0;
        pointer-events: none;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
      }

      .chat-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--feature-space-top) var(--feature-space-right) 20px var(--feature-space-left);
        border-bottom: 1px dashed rgba(186, 145, 112, 0.3);
        background: rgba(10, 10, 12, 0.95);
        position: relative;
        z-index: 10;
      }
      .header-copy {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .chat-name {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: rgba(196, 180, 138, 0.55);
        letter-spacing: 3px;
        text-transform: uppercase;
      }
      .username-input {
        font-family: var(--font-mono);
        font-size: 0.65rem;
        letter-spacing: 2px;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(196, 180, 138, 0.25);
        color: rgba(196, 180, 138, 0.7);
        outline: none;
        width: 100px;
        padding: 2px 0;
      }
      .username-input::placeholder {
        color: currentColor;
        font-family: var(--font-mono);
        font-size: var(--ui-text-placeholder);
        font-weight: 400;
        letter-spacing: var(--ui-letter-placeholder);
        opacity: var(--ui-placeholder-opacity);
        font-style: normal;
      }
      .username-input:focus { border-bottom-color: rgba(196, 180, 138, 0.6); color: rgba(196, 180, 138, 0.9); }
      .chat-overline {
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        letter-spacing: var(--ui-letter-section-header);
        color: var(--theme);
        opacity: 0.95;
        font-weight: 700;
      }

      .info-wrap {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        position: relative;
      }

      .voice-header-btn {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        background: transparent;
        border: none;
        color: var(--colorone-dim);
        cursor: pointer;
        transition: color 0.3s;
        padding: 4px 0;
      }
      .voice-header-btn:hover:not(:disabled) { color: var(--theme); }
      .voice-header-btn.active { color: var(--theme); animation: blink 1.5s infinite; }
      .voice-header-btn:disabled { opacity: 0.3; cursor: default; }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .header-btn-group {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .features-wrap {
        position: relative;
      }
      .features-panel {
        position: absolute;
        top: calc(100% + 12px);
        right: 0;
        width: 260px;
        background: rgba(10, 10, 12, 0.98);
        border: 1px dashed rgba(186, 145, 112, 0.4);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        z-index: 100;
      }
      .features-title {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        color: var(--colorone-dim);
        margin-bottom: 10px;
        display: block;
      }
      .feature-item {
        background: transparent;
        border: none;
        text-align: left;
        cursor: pointer;
        padding: 10px 0;
        border-bottom: 1px dashed rgba(186, 145, 112, 0.15);
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: background 0.2s;
      }
      .feature-item:last-child { border-bottom: none; }
      .feature-item:hover .feature-label { color: var(--theme); }
      .feature-label {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        color: var(--colorone-dim);
        transition: color 0.2s;
      }
      .feature-sub {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: rgba(186, 145, 112, 0.35);
        letter-spacing: 1px;
        font-style: italic;
      }

      .messages-area {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 1;
        overflow: hidden;
      }

      .messages-list {
        flex: 1;
        overflow-y: auto;
        padding: 24px var(--feature-space-right) 24px var(--feature-space-left);
        display: flex;
        flex-direction: column;
        gap: 32px;
        scrollbar-width: thin;
        scrollbar-color: rgba(186, 145, 112, 0.15) transparent;
      }
      .messages-list::-webkit-scrollbar { width: 4px; }
      .messages-list::-webkit-scrollbar-thumb { background: rgba(186, 145, 112, 0.15); }

      .history-entry .bubble-content {
        font-size: 0.92rem;
        opacity: 0.3;
        line-height: 1.6;
      }

      .chat-response {
        flex-shrink: 0;
      }

      .bubble-content {
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        color: #e0e0e0;
        line-height: 1.65;
      }
      .chat-shell .bubble-content.markdown-content {
        font-size: var(--ui-text-body);
      }
      .bubble-content p { margin: 0 0 10px 0; }
      .bubble-content p:last-child { margin-bottom: 0; }
      .bubble-content a {
        color: var(--theme);
        text-decoration-color: rgba(186, 145, 112, 0.55);
        text-underline-offset: 3px;
      }
      .bubble-content a:hover { color: #d6ad8a; }
      .bubble-content code {
        font-family: var(--font-mono);
        font-size: 0.9em;
        background: rgba(186,145,112,0.08);
        padding: 1px 5px;
        border-radius: 2px;
      }
      .bubble-content pre {
        background: rgba(186,145,112,0.06);
        border: 1px solid rgba(186,145,112,0.15);
        padding: 12px;
        overflow-x: auto;
        font-size: 0.92rem;
        margin: 8px 0;
      }
      .bubble-content blockquote {
        border-left: 2px solid var(--colorone-dim);
        padding-left: 12px;
        color: var(--colorone-dim);
        margin: 8px 0;
        font-style: italic;
      }
      .bubble-content ul, .bubble-content ol { padding-left: 20px; margin: 6px 0; }
      .bubble-content li { margin-bottom: 4px; }

      .suggest-prompts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
      }
      .suggest-btn {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        background: transparent;
        border: 1px dashed rgba(186, 145, 112, 0.35);
        color: var(--colorone-dim);
        padding: 6px 12px;
        cursor: pointer;
        transition: color 0.2s, border-color 0.2s, background 0.2s;
      }
      .suggest-btn:hover {
        color: var(--theme);
        border-color: var(--theme);
        background: rgba(186, 145, 112, 0.05);
      }

      .live-transcription {
        margin-top: 12px;
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: var(--colorone-dim);
        opacity: 0.6;
        letter-spacing: 1px;
        font-style: italic;
      }

      .streaming-cursor {
        display: inline-block;
        width: 8px; height: 1.1em;
        background: var(--theme);
        margin-left: 4px;
        vertical-align: middle;
        animation: blink 0.8s infinite;
      }
      .thinking-dots {
        color: var(--colorone-dim);
        font-style: normal;
        animation: blink 1.5s infinite;
        letter-spacing: 2px;
        margin-left: 4px;
      }
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

      .input-area {
        flex-shrink: 0;
        padding: 16px var(--feature-space-right) var(--feature-space-bottom) var(--feature-space-left);
        border-top: 1px dashed rgba(186, 145, 112, 0.3);
        background: rgba(10, 10, 12, 0.95);
        position: relative;
        z-index: 10;
      }

      .text-controls { max-width: 800px; margin: 0 auto; }

      .textarea-row {
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(186, 145, 112, 0.2);
        background: rgba(186, 145, 112, 0.02);
        padding: 16px;
        transition: border-color 0.3s;
      }
      .textarea-row:focus-within { border-color: var(--colorone-dim); background: rgba(186, 145, 112, 0.05); }

      .chat-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        font-weight: 400;
        letter-spacing: normal;
        color: var(--parchment);
        line-height: 1.5;
        padding: 10px 0;
        margin: 0;
        resize: none;
        max-height: 120px;
        overflow-y: auto;
        scrollbar-width: none;
        opacity: 0.9;
      }
      .chat-input::-webkit-scrollbar { display: none; }
      .chat-input::placeholder {
        color: currentColor;
        font-family: var(--font-mono);
        font-size: var(--ui-text-placeholder);
        font-weight: 400;
        letter-spacing: var(--ui-letter-placeholder);
        opacity: var(--ui-placeholder-opacity);
        font-style: normal;
      }
      .chat-input:disabled { opacity: 0.4; }

      .textarea-actions {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
        flex-shrink: 0;
      }
      .action-btn {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        background: transparent;
        border: none;
        color: var(--colorone-dim);
        cursor: pointer;
        transition: color 0.3s;
        padding: 4px;
        white-space: nowrap;
      }
      .action-btn:hover:not(:disabled) { color: var(--theme); }
      .action-btn.active { color: var(--theme); animation: blink 1.5s infinite; }
      .action-btn.send-btn { color: var(--theme); }
      .action-btn.send-btn:hover:not(:disabled) { text-shadow: 0 0 10px rgba(186, 145, 112, 0.5); }
      .action-btn:disabled { color: rgba(186, 145, 112, 0.3); cursor: default; }

      .live-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 800px;
        margin: 0 auto;
        border: 1px solid rgba(186, 145, 112, 0.2);
        padding: 16px 24px;
        background: rgba(186, 145, 112, 0.02);
      }

      .live-copy {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .live-title {
        font-family: var(--font-display);
        font-size: var(--ui-text-body);
        color: var(--theme);
        font-style: italic;
      }

      .live-subtitle {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        color: rgba(244, 232, 193, 0.4);
      }

      .mic-btn, .end-btn {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        letter-spacing: 2px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.3s;
        padding: 8px;
      }

      .mic-btn { color: var(--theme); }
      .mic-btn.listening { color: #f4e8c1; text-shadow: 0 0 8px rgba(244, 232, 193, 0.6); }
      .mic-btn.processing { color: var(--colorone-dim); animation: blink 1.5s infinite; }
      .mic-btn.holding { color: #60a5fa; text-shadow: 0 0 8px rgba(96, 165, 250, 0.6); }

      .end-btn { color: #dc2626; }
      .end-btn:hover { text-shadow: 0 0 8px rgba(220, 38, 38, 0.6); }

      ${isEmbedded ? `
        /* header */
        .chat-header {
          padding: 12px var(--feature-space-right) 12px var(--feature-space-left);
          flex-wrap: nowrap;
          align-items: center;
          gap: 6px;
        }
        .header-copy {
          flex: 1; min-width: 0; overflow: hidden;
          flex-direction: row; align-items: center; gap: 8px;
        }
        .chat-overline {
          font-size: var(--ui-text-section-header); letter-spacing: var(--ui-letter-section-header);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          flex-shrink: 1;
        }
        .chat-name {
          font-size: 0.65rem; letter-spacing: 1px;
          white-space: nowrap; flex-shrink: 0; opacity: 0.5;
        }
        .username-input { display: none; }
        .header-actions { flex-shrink: 0; }
        .header-btn-group { gap: 4px; }
        .voice-header-btn { font-size: var(--ui-text-action); letter-spacing: var(--ui-letter-action); padding: 2px 4px; white-space: nowrap; }

        /* messages */
        .messages-area { padding: 0; }
        .messages-list { padding: 16px var(--feature-space-right) 16px var(--feature-space-left); gap: 20px; }
        .bubble-content { font-size: var(--ui-text-body); line-height: 1.6; color: #e0e0e0; }

        /* input */
        .input-area { padding: 12px var(--feature-space-right) 12px var(--feature-space-left); }
        .text-controls { max-width: none; margin: 0; }
        .textarea-row { padding: 8px 10px; gap: 6px; }
        .chat-input { font-size: var(--ui-text-body); color: #e0e0e0; }
        .send-btn, .composer-tool { font-size: var(--ui-text-action); letter-spacing: var(--ui-letter-action); }

        /* live */
        .live-controls { max-width: none; margin: 0; padding: 10px var(--feature-space-right) 10px var(--feature-space-left); }
        .live-title { font-size: 0.92rem; }
        .live-subtitle { font-size: 0.65rem; letter-spacing: 1px; }
      ` : ''}

      @media (max-width: 768px) {
        .chat-header { padding: var(--feature-space-top) var(--feature-space-right) 12px var(--feature-space-left); flex-wrap: nowrap; gap: 8px; }
        .header-copy { min-width: 0; flex-shrink: 1; }
        .chat-name { font-size: 0.65rem; letter-spacing: 2px; }
        .chat-overline { font-size: var(--ui-text-section-header); letter-spacing: var(--ui-letter-section-header); white-space: nowrap; }
        .header-actions { flex-shrink: 0; gap: 8px; }
        .header-btn-group { gap: 8px; white-space: nowrap; }
        .username-input { width: 70px; flex: 1; max-width: 110px; font-size: 0.65rem; }
        .voice-header-btn { font-size: var(--ui-text-action); letter-spacing: var(--ui-letter-action); }
        
        .messages-list { padding: 20px var(--feature-space-right) 20px var(--feature-space-left); gap: 24px; }
        .message-bubble { max-width: 98%; }
        .bubble-content { font-size: var(--ui-text-body); }
        
        .input-area { padding: 12px var(--feature-space-right) var(--feature-space-bottom) var(--feature-space-left); }
        .textarea-row { padding: 10px; flex-wrap: wrap; gap: 4px; }
        .textarea-actions { order: 2; width: 100%; align-items: flex-end; flex-direction: column; gap: 8px; }
        .action-btn { font-size: var(--ui-text-action); padding: 4px 0; }
        .chat-input { order: 1; width: 100%; flex: none; font-size: var(--ui-text-body); }
        .live-controls { flex-direction: column; gap: 16px; text-align: center; }
      }
    `}</style>
  );
}
