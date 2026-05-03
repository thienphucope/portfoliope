import { useState, useCallback, useRef } from 'react';

export function useWindowResizer() {
  const [editorWidth, setEditorWidth] = useState(60); // %
  const [secondaryWeights, setSecondaryWeights] = useState({ chat: 1, pdf: 1, graph: 1 });
  const [isDragging, setIsDragging] = useState(null); // 'main', 'junction-chat-pdf', 'chat-pdf', etc.

  // Use refs for dragging to avoid closure issues and reduce re-renders if needed
  // But for now, we'll use state to trigger re-renders of the layout
  
  const startPos = useRef({ x: 0, y: 0 });
  const startWeights = useRef({});
  const startWidth = useRef(0);

  const onMouseDown = useCallback((e, type, ids = []) => {
    e.preventDefault();
    setIsDragging(type);
    startPos.current = { x: e.clientX, y: e.clientY };
    startWidth.current = editorWidth;
    startWeights.current = { ...secondaryWeights };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Set global cursor
    if (type === 'main') document.body.style.cursor = 'col-resize';
    else if (type.startsWith('junction')) document.body.style.cursor = 'move';
    else document.body.style.cursor = 'row-resize';
  }, [editorWidth, secondaryWeights]);

  const handleMouseMove = useCallback((e) => {
    const container = document.querySelector('.windows-container');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    setIsDragging(prev => {
      if (!prev) return null;

      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      const dxPercent = (dx / rect.width) * 100;
      const dyPercent = (dy / rect.height) * 100;

      if (prev === 'main') {
        setEditorWidth(Math.max(10, Math.min(90, startWidth.current + dxPercent)));
      } else if (prev.startsWith('junction')) {
        const [_, id1, id2] = prev.split('-');
        setEditorWidth(Math.max(10, Math.min(90, startWidth.current + dxPercent)));
        setSecondaryWeights(prevWeights => {
          const newWeights = { ...prevWeights };
          const totalWeight = prevWeights[id1] + prevWeights[id2];
          const weightChange = (dyPercent / 100) * totalWeight;
          newWeights[id1] = Math.max(0.1, startWeights.current[id1] + weightChange);
          newWeights[id2] = Math.max(0.1, startWeights.current[id2] - weightChange);
          return newWeights;
        });
      } else if (prev.includes('-')) {
        const [id1, id2] = prev.split('-');
        const isHorizontal = document.querySelector('.secondary-windows')?.style.flexDirection === 'row' || 
                             getComputedStyle(document.querySelector('.secondary-windows') || {}).flexDirection === 'row';
        
        setSecondaryWeights(prevWeights => {
          const newWeights = { ...prevWeights };
          const totalWeight = prevWeights[id1] + prevWeights[id2];
          const weightChange = (isHorizontal ? (dxPercent / 100) : (dyPercent / 100)) * totalWeight;
          newWeights[id1] = Math.max(0.1, startWeights.current[id1] + weightChange);
          newWeights[id2] = Math.max(0.1, startWeights.current[id2] - weightChange);
          return newWeights;
        });
      }
      
      return prev;
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  return {
    editorWidth,
    secondaryWeights,
    isDragging,
    onMouseDown
  };
}
