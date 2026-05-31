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
        justify-content: center;
      }

      .nf-tts-label {
        font-family: var(--font-display);
        font-size: var(--ui-text-title);
        font-weight: 700;
        letter-spacing: var(--ui-letter-section-header);
        color: var(--theme);
      }

      .nf-tts-textarea-row {
        display: flex;
        align-items: center;
        gap: 16px;
        border: 1px solid rgba(186, 145, 112, 0.2);
        background: rgba(186, 145, 112, 0.02);
        padding: 16px;
        transition: border-color 0.3s;
      }
      .nf-tts-textarea-row:focus-within {
        border-color: #8a6b52;
        background: rgba(186, 145, 112, 0.05);
      }

      .nf-tts-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--md-colortext);
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        font-weight: 400;
        letter-spacing: normal;
        line-height: 1.5;
        padding: 10px 0;
        margin: 0;
        resize: none;
        max-height: 120px;
        overflow-y: auto;
        scrollbar-width: none;
        opacity: 1;
      }
      .nf-tts-input::-webkit-scrollbar { display: none; }
      .nf-tts-input::placeholder {
        color: currentColor;
        font-family: var(--font-mono);
        font-size: var(--ui-text-placeholder);
        font-weight: 400;
        letter-spacing: var(--ui-letter-placeholder);
        opacity: var(--ui-placeholder-opacity);
        font-style: normal;
      }
      .nf-tts-input:disabled { opacity: 0.4; }

      .nf-tts-btn {
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        font-weight: 700;
        letter-spacing: var(--ui-letter-action);
        line-height: 1;
        text-transform: uppercase;
        background: transparent;
        border: none;
        color: var(--theme);
        cursor: pointer;
        transition: color 0.3s;
        padding: 8px 4px;
      }
      .nf-tts-btn:hover:not(:disabled) {
        text-shadow: 0 0 10px rgba(186, 145, 112, 0.5);
      }
      .nf-tts-btn:disabled { color: rgba(186, 145, 112, 0.3); cursor: default; }

      .nf-tts-error {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        color: #c07070;
        margin: 0;
        letter-spacing: 0.5px;
      }

      .nf-tts-history {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-top: 10px;
      }
      .nf-tts-history-item {
        background: rgba(186, 145, 112, 0.02);
        border: 1px dashed rgba(186, 145, 112, 0.15);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .nf-tts-history-text {
        font-family: var(--font-body);
        font-size: var(--ui-text-body);
        color: var(--md-colortext);
        margin: 0;
        font-style: italic;
        opacity: 0.85;
      }

      .nf-tts-audio {
        width: 100%;
        filter: invert(1) sepia(1) saturate(0.5) hue-rotate(180deg);
        opacity: 0.8;
      }
    `}</style>
  );
}
