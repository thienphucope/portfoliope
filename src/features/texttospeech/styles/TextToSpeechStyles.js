export default function TextToSpeechStyles() {
  return (
    <style jsx global>{`
      .nf-tts-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .nf-tts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .nf-tts-label {
        font-family: var(--font-display);
        font-size: var(--ui-text-section-header);
        font-weight: 700;
        letter-spacing: var(--ui-letter-section-header);
        text-transform: uppercase;
        color: var(--nf-accent);
      }

      .nf-tts-input {
        background: transparent;
        border: 1px solid var(--nf-border);
        color: var(--nf-txt);
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        font-weight: 400;
        letter-spacing: normal;
        line-height: 1.5;
        padding: 10px 12px;
        resize: none;
        outline: none;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.2s;
      }
      .nf-tts-input::placeholder {
        color: currentColor;
        font-family: var(--font-mono);
        font-size: var(--ui-text-placeholder);
        font-weight: 400;
        letter-spacing: var(--ui-letter-placeholder);
        opacity: var(--ui-placeholder-opacity);
        font-style: normal;
      }
      .nf-tts-input:focus { border-color: var(--nf-accent-dim); }
      .nf-tts-input:disabled { opacity: 0.5; }
      .nf-tts-input { scrollbar-width: thin; scrollbar-color: rgba(186,145,112,0.2) transparent; }
      .nf-tts-input::-webkit-scrollbar { width: 3px; }
      .nf-tts-input::-webkit-scrollbar-track { background: transparent; }
      .nf-tts-input::-webkit-scrollbar-thumb { background: rgba(186,145,112,0.2); border-radius: 0; }
      .nf-tts-input::-webkit-scrollbar-thumb:hover { background: rgba(186,145,112,0.4); }

      .nf-tts-btn {
        align-self: flex-start;
        background: none;
        border: none;
        color: var(--nf-txt-dim);
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        padding: 8px 16px;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
      }
      .nf-tts-btn:hover:not(:disabled) { border-color: var(--nf-accent-dim); color: var(--nf-accent); }
      .nf-tts-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .nf-tts-btn.loading { color: var(--nf-accent); border-color: var(--nf-accent-dim); opacity: 0.7; }

      .nf-tts-error {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: #c07070;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .nf-tts-audio {
        width: 100%;
        filter: invert(1) sepia(1) saturate(0.5) hue-rotate(180deg);
        opacity: 0.8;
      }
    `}</style>
  );
}
