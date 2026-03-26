import { useRef, useCallback } from 'react';

/**
 * Manages file locking/unlocking via the API.
 * Handles keep-alive intervals to maintain lock during editing.
 */
export function useLockManager({ sessionIdRef, onLockLost }) {
  const lockIntervalRef = useRef(null);

  const acquireLock = useCallback(async (targetPath, pass) => {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'lock',
        path: targetPath,
        password: pass,
        sessionId: sessionIdRef.current,
      }),
    });
    if (res.status === 403) throw new Error('wrong_pass');
    if (res.status === 423) throw new Error('locked_by_other');
    if (!res.ok) throw new Error('lock_failed');
    return await res.json();
  }, [sessionIdRef]);

  const releaseLock = useCallback((targetPath, pass) => {
    fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'unlock',
        path: targetPath,
        password: pass,
        sessionId: sessionIdRef.current,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [sessionIdRef]);

  const startKeepAlive = useCallback((filePath, pass) => {
    if (lockIntervalRef.current) clearInterval(lockIntervalRef.current);
    lockIntervalRef.current = setInterval(() => {
      acquireLock(filePath, pass).catch(() => {
        clearInterval(lockIntervalRef.current);
        onLockLost?.();
      });
    }, 20000);
  }, [acquireLock, onLockLost]);

  const stopKeepAlive = useCallback(() => {
    clearInterval(lockIntervalRef.current);
    lockIntervalRef.current = null;
  }, []);

  return { acquireLock, releaseLock, startKeepAlive, stopKeepAlive };
}
