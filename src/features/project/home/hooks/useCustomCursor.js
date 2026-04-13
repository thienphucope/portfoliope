"use client";
import { useCursorContext } from '../context/CursorContext';

/**
 * Hook to interact with the global custom cursor.
 */
export default function useCustomCursor() {
  const { setCursorType, cursorType } = useCursorContext();
  return { setCursorType, cursorType };
}
