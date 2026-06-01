import React from 'react';
import PromptStyles from '../styles/PromptStyles';

/**
 * Modal overlay components for user interactions in the case vault, handling
 * password authentication, new note naming, and comment addition prompts.
 */

export default function PromptOverlays({
  passPrompt,
  setPassPrompt,
  namePrompt,
  setNamePrompt,
  commentPrompt,
  setCommentPrompt
}) {
  return (
    <>
      <PromptStyles />
      {passPrompt && (
        <div className="pass-overlay" onClick={() => { passPrompt.reject(new Error('cancelled')); setPassPrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">Please enter password to edit</div>
            <input
              className="pass-modal__input"
              type="password"
              placeholder="Edit password…"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (!val) return;
                  passPrompt.resolve(val);
                  setPassPrompt(null);
                }
                if (e.key === 'Escape') {
                  passPrompt.reject(new Error('cancelled'));
                  setPassPrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter to verify · Esc to cancel</div>
          </div>
        </div>
      )}

      {namePrompt && (
        <div className="pass-overlay" onClick={() => { namePrompt.reject(new Error('cancelled')); setNamePrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">{namePrompt.title || "Enter the name for your new note"}</div>
            <input
              className="pass-modal__input"
              type="text"
              placeholder="Note name…"
              autoFocus
              defaultValue={namePrompt.defaultValue || ""}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (!val) return;
                  namePrompt.resolve(val);
                  setNamePrompt(null);
                }
                if (e.key === 'Escape') {
                  namePrompt.reject(new Error('cancelled'));
                  setNamePrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter to confirm · Esc to cancel</div>
          </div>
        </div>
      )}

      {commentPrompt && (
        <div className="pass-overlay" onClick={() => { commentPrompt.reject(new Error('cancelled')); setCommentPrompt(null); }}>
          <div className="pass-modal" onClick={e => e.stopPropagation()}>
            <div className="pass-modal__title">Add a comment to this note</div>
            <textarea
              className="pass-modal__input"
              style={{ minHeight: '100px', resize: 'vertical', paddingTop: '10px' }}
              placeholder="Your comment…"
              autoFocus
              defaultValue={commentPrompt.defaultValue}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const val = e.target.value.trim();
                  if (!val) return;
                  commentPrompt.resolve(val);
                  setCommentPrompt(null);
                }
                if (e.key === 'Escape') {
                  commentPrompt.reject(new Error('cancelled'));
                  setCommentPrompt(null);
                }
              }}
            />
            <div className="pass-modal__hint">Enter to add · Shift+Enter for new line · Esc to cancel</div>
          </div>
        </div>
      )}
    </>
  );
}
