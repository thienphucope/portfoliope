import React from 'react';

export default function PromptStyles() {
  return (
    <style jsx global>{`
        /* Password modal */
        .pass-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: var(--background); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .pass-modal {
          background: var(--background); border: 1px solid var(--theme);
          border-radius: 12px; padding: 24px 28px; min-width: 300px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        }
        .pass-modal__title { font-family:var(--font-body); font-size:14px; font-weight:600; color:var(--theme); }
        .pass-modal__input {
          background: rgba(255,255,255,0.05); border: 1px solid var(--theme);
          border-radius: 8px; padding: 10px 14px; color: var(--theme);
          font-family: var(--font-body); font-size: var(--ui-text-body);
          font-weight: 400; letter-spacing: normal; outline: none;
          caret-color: var(--theme);
        }
        .pass-modal__input::placeholder {
          color: currentColor;
          font-family: var(--font-mono);
          font-size: var(--ui-text-placeholder);
          font-weight: 400;
          letter-spacing: var(--ui-letter-placeholder);
          opacity: var(--ui-placeholder-opacity);
          font-style: normal;
        }
        .pass-modal__input:focus { border-color: var(--theme); }
        .pass-modal__hint { font-size: 11px; opacity: 0.6; font-family:var(--font-body); color: var(--theme); }
    `}</style>
  );
}
