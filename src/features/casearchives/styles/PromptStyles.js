import React from 'react';

export default function PromptStyles() {
  return (
    <style jsx global>{`
        /* Password modal */
        .pass-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: var(--colortab); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
        }
        .pass-modal {
          background: var(--colortab); border: 1px solid var(--colortext-spine);
          border-radius: 12px; padding: 24px 28px; min-width: 300px;
          display: flex; flex-direction: column; gap: 12px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.7);
        }
        .pass-modal__title { font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:var(--colortext-spine); }
        .pass-modal__input {
          background: rgba(255,255,255,0.05); border: 1px solid var(--colortext-spine);
          border-radius: 8px; padding: 10px 14px; color: var(--colortext-spine);
          font-family: 'Inter', sans-serif; font-size: 14px; outline: none;
          caret-color: var(--colortext-spine);
        }
        .pass-modal__input:focus { border-color: var(--colortext-spine); }
        .pass-modal__hint { font-size: 11px; opacity: 0.6; font-family:'Inter',sans-serif; color: var(--colortext-spine); }
    `}</style>
  );
}
