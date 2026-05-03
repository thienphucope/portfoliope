import { useEffect } from 'react';

/**
 * Warns before closing/refreshing only when there are known server-backed drafts.
 * Local client cache is no longer used.
 */
export function useBeforeUnload({ serverRawCache }) {
  useEffect(() => {
    // Local draft cache was removed. Keep hook as a no-op placeholder.
    void serverRawCache;
    return undefined;
  }, [serverRawCache]);
}
