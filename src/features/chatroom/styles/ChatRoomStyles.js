export default function ChatRoomStyles({ isEmbedded }) {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap');

      :root {
        --void: #0a0a0c;
        --colorone: #ba9170;
        --colorone-dim: #8a6b52;
        --parchment: #f4e8c1;
        --parchment-dark: #c4b48a;
        --font-display: 'Playfair Display', Georgia, serif;
        --font-typewriter: 'Special Elite', monospace;
        --font-body: 'EB Garamond', Georgia, serif;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }
      ${!isEmbedded ? 'html, body { height: 100%; background: var(--void); overflow: hidden; }' : ''}

      .chat-shell {
        position: fixed;
        inset: 0;
        background: var(--void);
        background-image:
          radial-gradient(circle at 10% 20%, rgba(186, 145, 112, 0.05), transparent 40rem),
          repeating-linear-gradient(0deg, rgba(186, 145, 112, 0.02) 0, rgba(186, 145, 112, 0.02) 1px, transparent 1px, transparent 3px);
        color: var(--parchment);
        font-family: var(--font-body);
        display: flex;
        flex-direction: column;
      }

      .chat-shell::after {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        box-shadow: inset 0 0 100px rgba(0,0,0,0.8);
      }

      .chat-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 32px;
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
        font-family: var(--font-typewriter);
        font-size: 0.65rem;
        color: rgba(196, 180, 138, 0.55);
        letter-spacing: 3px;
        text-transform: uppercase;
      }
      .chat-overline {
        font-family: var(--font-typewriter);
        font-size: 0.85rem;
        letter-spacing: 4.5px;
        text-transform: uppercase;
        color: var(--colorone);
        opacity: 0.95;
      }

      .presence-status {
        font-family: var(--font-typewriter);
        font-size: 0.8rem;
        letter-spacing: 2px;
        color: var(--colorone-dim);
      }
      .presence-status.active {
        color: var(--colorone);
        animation: blink 1.5s infinite;
      }

      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 32px 24px 16px;
        display: flex;
        flex-direction: column;
        scrollbar-width: thin;
        scrollbar-color: rgba(186, 145, 112, 0.2) transparent;
        position: relative;
        z-index: 1;
      }
      .messages-area::-webkit-scrollbar { width: 6px; }
      .messages-area::-webkit-scrollbar-thumb { background: rgba(186, 145, 112, 0.2); border-radius: 0; }

      .messages-inner {
        width: min(100%, 800px);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .message-row {
        display: flex;
        flex-direction: column;
        width: 100%;
      }
      .message-row.assistant { align-items: flex-start; }
      .message-row.user { align-items: flex-end; }

      .message-bubble {
        max-width: 85%;
        padding: 12px 0;
        position: relative;
      }

      .message-row.assistant .message-bubble {
        padding-left: 20px;
        border-left: 2px solid var(--colorone-dim);
      }

      .message-row.user .message-bubble {
        padding-right: 20px;
        border-right: 2px solid rgba(244, 232, 193, 0.3);
        text-align: right;
      }

      .message-bubble.transcribing {
        opacity: 0.6;
        border-style: dashed;
      }

      .bubble-name {
        font-family: var(--font-typewriter);
        font-size: 0.75rem;
        letter-spacing: 3px;
        color: var(--colorone-dim);
        display: block;
        margin-bottom: 8px;
      }
      .message-row.user .bubble-name {
        color: rgba(244, 232, 193, 0.5);
      }

      .bubble-content {
        font-family: var(--font-body);
        font-size: 1.2rem;
        color: #ffffff;
        line-height: 1.6;
      }

      .message-row.user .bubble-content {
        color: rgba(255, 255, 255, 0.9);
      }

      .message-row.assistant .bubble-content { font-style: italic; }
      .bubble-content p { margin: 0 0 12px 0; }
      .bubble-content p:last-child { margin-bottom: 0; }
      .bubble-content a {
        color: var(--colorone);
        text-decoration-color: rgba(186, 145, 112, 0.55);
        text-underline-offset: 3px;
      }
      .bubble-content a:hover {
        color: #d6ad8a;
        text-decoration-color: currentColor;
      }

      .streaming-cursor {
        display: inline-block;
        width: 8px; height: 1.1em;
        background: var(--colorone);
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
        padding: 24px 32px;
        border-top: 1px dashed rgba(186, 145, 112, 0.3);
        background: rgba(10, 10, 12, 0.95);
        position: relative;
        z-index: 10;
      }

      .text-controls { max-width: 800px; margin: 0 auto; }

      .textarea-row {
        display: flex;
        align-items: flex-end;
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
        font-size: 1.15rem;
        color: var(--parchment);
        line-height: 1.6;
        resize: none;
        max-height: 120px;
        overflow-y: auto;
        scrollbar-width: none;
        opacity: 0.9;
      }
      .chat-input::-webkit-scrollbar { display: none; }
      .chat-input::placeholder { color: rgba(244, 232, 193, 0.2); font-style: italic; }
      .chat-input:disabled { opacity: 0.4; }

      .composer-tool, .send-btn {
        font-family: var(--font-typewriter);
        font-size: 0.8rem;
        letter-spacing: 2px;
        background: transparent;
        border: none;
        color: var(--colorone-dim);
        cursor: pointer;
        transition: color 0.3s;
        padding: 8px 4px;
      }
      .composer-tool:hover { color: var(--colorone); }
      .send-btn { color: var(--colorone); font-weight: bold; }
      .send-btn:hover:not(:disabled) { text-shadow: 0 0 10px rgba(186, 145, 112, 0.5); }
      .send-btn:disabled { color: rgba(186, 145, 112, 0.3); cursor: default; }

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
        font-size: 1.1rem;
        color: var(--colorone);
        font-style: italic;
      }

      .live-subtitle {
        font-family: var(--font-typewriter);
        font-size: 0.7rem;
        letter-spacing: 2px;
        color: rgba(244, 232, 193, 0.4);
      }

      .mic-btn, .end-btn {
        font-family: var(--font-typewriter);
        font-size: 0.9rem;
        letter-spacing: 2px;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.3s;
        padding: 8px;
      }

      .mic-btn { color: var(--colorone); }
      .mic-btn.listening { color: #f4e8c1; text-shadow: 0 0 8px rgba(244, 232, 193, 0.6); }
      .mic-btn.processing { color: var(--colorone-dim); animation: blink 1.5s infinite; }
      .mic-btn.holding { color: #60a5fa; text-shadow: 0 0 8px rgba(96, 165, 250, 0.6); }

      .end-btn { color: #dc2626; }
      .end-btn:hover { text-shadow: 0 0 8px rgba(220, 38, 38, 0.6); }

      @media (max-width: 768px) {
        .chat-header { padding: 16px 20px; }
        .chat-name { font-size: 0.6rem; }
        .chat-overline { font-size: 0.75rem; letter-spacing: 2px; }
        .messages-area { padding: 24px 16px 12px; }
        .message-bubble { max-width: 95%; font-size: 1.1rem; }
        .input-area { padding: 16px; }
        .textarea-row { padding: 12px; flex-wrap: wrap; }
        .composer-tool { order: 2; width: 45%; text-align: left; }
        .send-btn { order: 3; width: 45%; text-align: right; }
        .chat-input { order: 1; width: 100%; flex: none; }
        .live-controls { flex-direction: column; gap: 20px; text-align: center; }
      }
    `}</style>
  );
}
