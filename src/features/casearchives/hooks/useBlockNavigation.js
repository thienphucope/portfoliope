import { useState, useCallback } from 'react';

/**
 * Hook for managing block navigation, creation, and deletion in BlockEditor.
 */
export function useBlockNavigation({ blocks, setBlocks }) {
  const [activeBlockIndex, setActive] = useState(null);
  const [cursorPos, setCursorPos] = useState('end');

  const createBlockAfter = useCallback((index) => {
    const fresh = {
      id: `b${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      raw: '',
      type: 'paragraph'
    };
    setBlocks(prev => {
      const n = [...prev];
      n.splice(index + 1, 0, fresh);
      return n;
    });
    setActive(index + 1);
  }, [setBlocks]);

  const navigateBlock = useCallback((index, direction, deleteBlock = false) => {
    if (deleteBlock) {
      setBlocks(prev => {
        if (prev.length <= 1) return prev;
        const n = [...prev];
        n.splice(index, 1);
        return n;
      });
      setCursorPos('end');
      setActive(Math.max(0, index - 1));
      return;
    }
    if (direction === 'up' && index > 0) {
      setCursorPos('end');
      setActive(index - 1);
    }
    if (direction === 'down' && index < blocks.length - 1) {
      setCursorPos('start');
      setActive(index + 1);
    }
  }, [blocks.length, setBlocks]);

  return {
    activeBlockIndex,
    setActive,
    cursorPos,
    setCursorPos,
    createBlockAfter,
    navigateBlock
  };
}
