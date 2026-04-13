"use client";
import { createContext, useContext, useState, useEffect } from 'react';

const CursorContext = createContext();

export function CursorProvider({ children }) {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState('default'); // 'default' or 'magnifier'

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Use class-based approach for cleaner global styles
  useEffect(() => {
    if (cursorType === 'magnifier') {
      document.documentElement.classList.add('custom-cursor-active');
    } else {
      document.documentElement.classList.remove('custom-cursor-active');
    }
  }, [cursorType]);

  const customCursorJSX = cursorType === 'magnifier' ? (
    <div 
      className="fixed pointer-events-none z-[99999] transition-transform duration-75 ease-out"
      style={{
        left: mousePos.x,
        top: mousePos.y,
        transform: 'translate(-50%, -50%) rotate(15deg)'
      }}
    >
      <img 
        src="/cursorhalf.png" 
        alt="Custom Cursor" 
        className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(194,163,138,0.7)]"
      />
    </div>
  ) : null;

  return (
    <CursorContext.Provider value={{ setCursorType, cursorType }}>
      {customCursorJSX}
      {children}
    </CursorContext.Provider>
  );
}

export const useCursorContext = () => useContext(CursorContext);
