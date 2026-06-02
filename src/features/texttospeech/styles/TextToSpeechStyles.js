export default function TextToSpeechStyles() {
  return (
    <style jsx global>{`
      .voice-route {
        min-height: 100dvh;
        padding: var(--feature-space);
        background: var(--feature-bg, #0a0a0c);
        color: var(--md-colortext);
        background-image: radial-gradient(circle at 10% 20%, rgba(186, 145, 112, 0.05), transparent 40rem), repeating-linear-gradient(0deg, rgba(186, 145, 112, 0.02) 0, rgba(186, 145, 112, 0.02) 1px, transparent 1px, transparent 3px);
        box-sizing: border-box;
      }

      .voice-route-inner {
        width: 100%;
        height: calc(100dvh - var(--feature-space-top) - var(--feature-space-bottom));
        background: transparent;
        padding: 0;
        border: none;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .nf-tts-section {
        --tts-edge-left: 0px;
        --tts-edge-right: 0px;
        --tts-header-top: var(--feature-header-bottom);
        --tts-header-bottom: var(--feature-header-bottom);
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .voice-route-inner .nf-tts-section {
        --tts-edge-left: var(--feature-space-left);
        --tts-edge-right: var(--feature-space-right);
        --tts-header-top: 0px;
      }

      .nf-feature-panel-body .nf-tts-section {
        --tts-edge-left: var(--feature-space-left);
        --tts-edge-right: var(--feature-space-right);
        --tts-header-top: var(--feature-header-top);
        height: calc(100% + var(--feature-space-top) + var(--feature-space-bottom));
        margin-top: calc(-1 * var(--feature-space-top));
        margin-bottom: calc(-1 * var(--feature-space-bottom));
      }

      .nf-tts-header {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: calc(-1 * var(--tts-edge-left));
        margin-right: calc(-1 * var(--tts-edge-right));
        padding: var(--tts-header-top) var(--tts-edge-right) var(--tts-header-bottom) var(--tts-edge-left);
        border-bottom: var(--feature-divider);
        box-sizing: border-box;
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

      .nf-tts-history-area {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: none;
      }
      .nf-tts-history-area::-webkit-scrollbar { display: none; }

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
        padding: 6px 0 18px;
      }

      .nf-tts-empty {
        min-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-mono);
        font-size: var(--ui-text-action);
        letter-spacing: var(--ui-letter-action);
        color: rgba(224,224,224,0.35);
        text-transform: uppercase;
        text-align: center;
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

      .nf-tts-composer {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-left: calc(-1 * var(--tts-edge-left));
        margin-right: calc(-1 * var(--tts-edge-right));
        padding: var(--feature-header-bottom) var(--tts-edge-right) var(--feature-header-bottom) var(--tts-edge-left);
        border-top: var(--feature-divider);
        box-sizing: border-box;
      }

      @media (max-width: 768px) {
        .voice-route {
          padding: var(--feature-space-top) var(--feature-space-right) var(--feature-space-bottom) var(--feature-space-left);
        }

        .voice-route-inner {
          width: 100%;
          padding: 0;
          border: none;
          background: transparent;
          min-height: calc(100dvh - var(--feature-space-top) - var(--feature-space-bottom));
        }

        .voice-route-inner .nf-tts-section {
          --tts-edge-left: 0px;
          --tts-edge-right: 0px;
          --tts-header-top: 0px;
        }

        .nf-tts-section {
          min-height: calc(100dvh - var(--feature-space-top) - var(--feature-space-bottom));
          gap: 14px;
        }

        .nf-tts-header {
          justify-content: center;
        }

        .nf-tts-label {
          width: 100%;
          justify-content: center;
          text-align: center;
        }

        .nf-tts-textarea-row {
          flex-direction: column;
          align-items: stretch;
          gap: 12px;
          padding: 14px;
        }

        .nf-tts-input {
          width: 100%;
          min-height: 96px;
          max-height: none;
          padding: 0;
          box-sizing: border-box;
        }

        .nf-tts-btn {
          width: 100%;
          min-height: 44px;
          padding: 12px 0 0;
          border-top: var(--feature-divider);
        }

        .nf-tts-history {
          gap: 12px;
        }

        .nf-tts-history-item {
          padding: 14px;
        }
      }

      @media (max-width: 480px) {
        .nf-tts-textarea-row {
          padding: 12px;
        }

        .nf-tts-input {
          min-height: 90px;
        }
      }
    `}</style>
  );
}
