export default function ChatDeskStyles() {
  return (
    <style jsx global>{`
      html, body { height: 100%; overflow: hidden; }

      .chat-desk {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100dvh;
        overflow: hidden;
        color: #f4e8c1;
        background: #000;
        font-family: 'Special Elite', 'Courier New', monospace;
      }

      .send-arrow {
        position: absolute;
        top: 22px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 3;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        cursor: default;
        user-select: none;
        pointer-events: none;
      }
      .arrow-line {
        width: 10px;
        height: 54px;
        background: color-mix(in srgb, var(--theme) 70%, transparent);
        border-radius: 999px;
      }
      .arrow-head {
        width: 0;
        height: 0;
        border-left: 23px solid transparent;
        border-right: 23px solid transparent;
        border-bottom: 34px solid color-mix(in srgb, var(--theme) 70%, transparent);
        margin-bottom: -7px;
      }
      .arrow-label {
        font-size: 0.68rem;
        letter-spacing: 0.14em;
        color: rgba(243, 208, 152, 0.55);
      }

      .chat-desk { --paper: #f5f4ef; --paper-ink: #16211f; }

      .desk-paper {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        width: min(320px, 78vw);
        background: var(--paper);
        border: 1px solid rgba(0, 0, 0, 0.14);
        box-shadow: 0 12px 30px rgba(0,0,0,0.62), 0 2px 6px rgba(0,0,0,0.4);
        padding: 18px 20px;
        font-size: 0.86rem;
        line-height: 1.6;
        color: var(--paper-ink);
        cursor: grab;
      }
      .desk-paper:active { cursor: grabbing; }

      .response-paper { color: var(--paper-ink); font-size: 1.02rem; }
      .response-paper .markdown-content,
      .response-paper .markdown-content h1,
      .response-paper .markdown-content h2,
      .response-paper .markdown-content h3,
      .response-paper .markdown-content h4,
      .response-paper .markdown-content h5,
      .response-paper .markdown-content h6,
      .response-paper .markdown-content .fit-heading,
      .response-paper .markdown-content .table-container th { color: var(--paper-ink); }
      .response-paper .markdown-content a { color: #7a4a12; border-bottom-color: rgba(122,74,18,0.45); }
      .response-paper .markdown-content blockquote { border-left-color: rgba(0,0,0,0.22); }
      .paper-tool-trace {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 0.72rem;
        color: rgba(22, 33, 31, 0.55);
        margin-bottom: 10px;
        text-align: center;
      }
      .thinking-dots { color: rgba(22, 33, 31, 0.55); }

      .paper-stack {
        position: absolute;
        left: 50%;
        top: 50%;
        margin-left: -160px;
        margin-top: -110px;
        width: min(320px, 78vw);
        height: 220px;
        z-index: auto;
      }

      .writable-paper {
        position: absolute;
        inset: 0;
        height: 220px;
        display: flex;
        flex-direction: column;
        overflow: visible;
        transition: box-shadow 0.2s ease;
      }
      .writable-paper.focused {
        box-shadow: 0 10px 26px rgba(0,0,0,0.22), 0 0 0 2px var(--theme);
        cursor: text;
      }
      .paper-textarea {
        flex: 1;
        width: 100%;
        resize: none;
        border: none;
        outline: none;
        background: transparent;
        color: var(--paper-ink);
        font-family: 'Special Elite', 'Courier New', monospace;
        font-size: var(--md-size);
        line-height: 1.6;
        pointer-events: none;
      }
      .writable-paper.focused .paper-textarea { pointer-events: auto; }
      .paper-textarea::placeholder { color: rgba(22, 33, 31, 0.38); }

      .magnifier {
        position: absolute;
        left: clamp(16px, 4vw, 44px);
        bottom: clamp(16px, 3vh, 28px);
        z-index: 46;
        width: 375px;
        height: 375px;
        cursor: grab;
        touch-action: none;
      }
      .magnifier img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3)); user-select: none; transform: rotate(-20deg); transition: transform 0.2s ease; }
      .magnifier.held { cursor: grabbing; z-index: 50; }
      .magnifier.held img { transform: rotate(-20deg) scale(1.08); }
      .live-status {
        position: absolute;
        bottom: 6%;
        left: 50%;
        transform: translateX(-50%);
        z-index: 46;
        font-size: 0.82rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        white-space: nowrap;
        pointer-events: none;
      }
      .live-status--listening { color: #b07a2e; }
      .live-status--transcribing { color: #2f8f57; }
      .live-status--responding { color: #c0392b; }

      .desk-trash {
        position: absolute;
        right: clamp(16px, 4vw, 44px);
        bottom: clamp(16px, 3vh, 28px);
        z-index: 46;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(243, 208, 152, 0.18);
        border-radius: 50%;
        background: rgba(10, 20, 22, 0.5);
        color: rgba(243, 208, 152, 0.45);
        font-size: 1.3rem;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
      }
      .desk-trash:hover {
        border-color: rgba(243, 208, 152, 0.45);
        color: rgba(243, 208, 152, 0.75);
      }

      @media (max-width: 480px) {
        .desk-paper, .paper-stack { width: 68vw; }
        .writable-paper, .paper-stack { height: 150px; }
        .desk-paper { padding: 12px 14px; }
        .paper-textarea, .response-paper, .response-paper .markdown-content { font-size: 15px; }
        .paper-stack {
          left: 50%;
          top: 30%;
          margin-left: -34vw;
          margin-top: -75px;
        }
        .magnifier {
          width: 200px;
          height: 200px;
          top: auto;
          bottom: 16px;
          left: 16px;
          right: auto;
          margin-top: 0;
        }
        .desk-trash { width: 44px; height: 44px; font-size: 1.1rem; }
      }
    `}</style>
  );
}
