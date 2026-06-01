import { useState, useCallback } from 'react';

/**
 * Manages imperative promise-based prompts for:
 * - Password input
 * - File name input
 * - Comment input
 *
 * Returns state for rendering <PromptOverlays /> and trigger functions.
 */
export function usePrompts() {
  const [passPrompt,    setPassPrompt]    = useState(null);
  const [namePrompt,    setNamePrompt]    = useState(null);
  const [commentPrompt, setCommentPrompt] = useState(null);

  const askPassword = useCallback(
    () => new Promise((resolve, reject) => setPassPrompt({ resolve, reject })),
    []
  );

  const askFileName = useCallback(
    (defaultValue = '', title = '') =>
      new Promise((resolve, reject) => setNamePrompt({ resolve, reject, defaultValue, title })),
    []
  );

  const askComment = useCallback(
    (defaultValue = '') =>
      new Promise((resolve, reject) => setCommentPrompt({ resolve, reject, defaultValue })),
    []
  );

  return {
    // State for PromptOverlays
    passPrompt,    setPassPrompt,
    namePrompt,    setNamePrompt,
    commentPrompt, setCommentPrompt,
    // Trigger functions
    askPassword,
    askFileName,
    askComment,
  };
}
