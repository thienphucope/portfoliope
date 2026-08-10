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
        color: #d7e7e3;
        background:
          radial-gradient(120% 70% at 50% 4%, rgba(174,226,218,0.10), transparent 42%),
          radial-gradient(140% 90% at 50% 118%, rgba(61,107,106,0.16), transparent 60%),
          #070f11;
        font-family: 'Special Elite', 'Courier New', monospace;
        border: 1px solid rgba(174, 226, 218, 0.16);
        box-shadow:
          inset 0 0 0 5px rgba(7, 15, 17, 0.6),
          inset 0 0 0 6px rgba(174, 226, 218, 0.14);
      }
      .chat-desk::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        mix-blend-mode: screen;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
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
        color: rgba(174, 226, 218, 0.55);
      }

      .desk-paper {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 2;
        width: min(320px, 78vw);
        background: rgba(13, 27, 30, 0.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(174, 226, 218, 0.22);
        box-shadow: 0 10px 26px rgba(0,0,0,0.5), 0 0 24px rgba(174,226,218,0.12);
        padding: 18px 20px;
        font-size: 0.86rem;
        line-height: 1.6;
        cursor: grab;
      }
      .desk-paper:active { cursor: grabbing; }

      .response-paper { color: #d7e7e3; font-size: 1.02rem; }
      .response-paper .markdown-content { color: #d7e7e3; }
      .paper-tool-trace {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        font-size: 0.72rem;
        color: var(--theme);
        margin-bottom: 10px;
        text-align: center;
      }
      .thinking-dots { color: var(--theme); }

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
        color: #d7e7e3;
        font-family: 'Special Elite', 'Courier New', monospace;
        font-size: var(--md-size);
        line-height: 1.6;
        pointer-events: none;
      }
      .writable-paper.focused .paper-textarea { pointer-events: auto; }
      .paper-textarea::placeholder { color: rgba(174, 226, 218, 0.4); }

      .magnifier {
        position: absolute;
        right: 14%;
        top: 50%;
        margin-top: -187.5px;
        z-index: 5;
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
        z-index: 6;
        font-size: 0.82rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        white-space: nowrap;
        pointer-events: none;
      }
      .live-status--listening { color: #b07a2e; }
      .live-status--transcribing { color: #2f8f57; }
      .live-status--responding { color: #c0392b; }

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
          top: 62%;
          bottom: auto;
          left: calc(50% - 100px);
          right: auto;
          margin-top: 0;
        }
      }
    `}</style>
  );
}
