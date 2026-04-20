import { useRef, useEffect, useCallback } from 'react';

const OVERLAY_TABS = new Set(['chat', 'pdf']);

/**
 * Handles all custom scroll logic for the accordion app shell:
 * - Mouse-wheel → horizontal scroll of the app shell
 * - Mouse-wheel → vertical scroll within .markdown-container, .file-list, .chat-history
 * - Mouse-wheel → horizontal scroll within .table-container, pre, .math-block
 * - Tab-change → smooth animated horizontal scroll to target tab
 * - Mobile header show/hide on scroll
 */
export function useScrollBehavior({ appShellRef, tabs, setShowHeader, setShowFunctionBall }) {
  const isTabScrolling      = useRef(false);
  const tabAnimId           = useRef(null);
  const targetScrollX       = useRef(null);
  const isWheelScrollingX   = useRef(false);
  const verticalScrollTargets = useRef(new Map());
  const isWheelScrollingY   = useRef(new Map());

  // ─── Mobile header visibility ──────────────────────────────────────────────

  useEffect(() => {
    const handleGlobalScroll = (e) => {
      if (window.innerWidth > 1024) return;
      const target = e.target;
      if (!target || (!target.scrollTop && target !== document.documentElement)) return;

      const currentScrollY = target.scrollTop || window.scrollY;
      const diff = currentScrollY - (target._lastScrollY || 0);

      if (diff > 10 && currentScrollY > 100) {
        setShowHeader(false);
        if (setShowFunctionBall) setShowFunctionBall(false);
      } else if (diff < -10) {
        setShowHeader(true);
        if (setShowFunctionBall) setShowFunctionBall(true);
      }

      target._lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleGlobalScroll, true);
    return () => window.removeEventListener('scroll', handleGlobalScroll, true);
  }, [setShowHeader, setShowFunctionBall]);

  // ─── Scroll to specific tab ────────────────────────────────────────────────

  const scrollToTab = useCallback(
    (tabId) => {
      if (!appShellRef.current) return;
      const tabIndex = tabs.findIndex((t) => t.id === tabId);
      if (tabIndex === -1) return;

      // Overlay tabs don't trigger horizontal scroll
      if (OVERLAY_TABS.has(tabId)) return;

      const isMobileVertical =
        (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth) ||
        window.innerWidth <= 768;

      if (isMobileVertical) {
        appShellRef.current.scrollTo({ top: tabIndex * 50, behavior: 'smooth' });
        return;
      }

      isTabScrolling.current = true;
      targetScrollX.current  = null;
      if (tabAnimId.current) cancelAnimationFrame(tabAnimId.current);

      const spineWidth         = 150;
      const visibleClosedBefore = Math.max(0, tabIndex - 2);
      const tabPosition        = 150 + visibleClosedBefore * spineWidth;
      const scrollTarget       = Math.max(0, tabPosition - 380);

      const startScroll = appShellRef.current.scrollLeft;
      const distance    = scrollTarget - startScroll;
      const duration    = 600;
      let startTs       = null;

      const step = (timestamp) => {
        if (!startTs) startTs = timestamp;
        const progress = Math.min((timestamp - startTs) / duration, 1);
        const ease     = 1 - Math.pow(1 - progress, 4); // easeOutQuart

        if (appShellRef.current && isTabScrolling.current) {
          appShellRef.current.scrollLeft = startScroll + distance * ease;
        }

        if (progress < 1 && isTabScrolling.current) {
          tabAnimId.current = requestAnimationFrame(step);
        } else {
          isTabScrolling.current = false;
          tabAnimId.current      = null;
        }
      };
      tabAnimId.current = requestAnimationFrame(step);
    },
    [appShellRef, tabs]
  );

  // ─── Mouse-wheel handler ───────────────────────────────────────────────────

  useEffect(() => {
    const handleWheel = (e) => {
      if (!appShellRef.current || e.deltaY === 0 || e.shiftKey) return;

      const isMobileVertical =
        (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth) ||
        window.innerWidth <= 768;
      if (isMobileVertical) return;

      if (isTabScrolling.current) {
        isTabScrolling.current = false;
        if (tabAnimId.current) cancelAnimationFrame(tabAnimId.current);
      }

      // 1. Inner horizontal-scrollable elements
      const hScrollable = e.target.closest('.table-container, pre, .math-block');
      if (hScrollable) {
        const canLeft  = hScrollable.scrollLeft > 0;
        const canRight = Math.ceil(hScrollable.scrollLeft + hScrollable.clientWidth) < hScrollable.scrollWidth;
        if ((e.deltaY < 0 && canLeft) || (e.deltaY > 0 && canRight)) {
          e.preventDefault();
          hScrollable.scrollLeft += e.deltaY;
          return;
        }
      }

      // 2. Inner vertical-scrollable elements
      const vScrollable = e.target.closest('.markdown-container, .file-list, .horizontal-tabs-container, .search-results, .note-gallery-container, .note-feed-container');
      
      // Special case: Allow these to scroll natively without custom animation or horizontal hijacking
      if (e.target.closest('.pdf-body, .chat-history, canvas, .note-feed-container')) {
        return; 
      }

      if (vScrollable) {
        const canUp   = vScrollable.scrollTop > 0;
        const canDown = Math.ceil(vScrollable.scrollTop + vScrollable.clientHeight) < vScrollable.scrollHeight;

        if ((e.deltaY < 0 && canUp) || (e.deltaY > 0 && canDown)) {
          e.preventDefault();

          if (!verticalScrollTargets.current.has(vScrollable)) {
            verticalScrollTargets.current.set(vScrollable, vScrollable.scrollTop);
          }

          let targetY = verticalScrollTargets.current.get(vScrollable) + e.deltaY * 1.5;
          targetY = Math.max(0, Math.min(targetY, vScrollable.scrollHeight - vScrollable.clientHeight));
          verticalScrollTargets.current.set(vScrollable, targetY);

          if (!isWheelScrollingY.current.get(vScrollable)) {
            isWheelScrollingY.current.set(vScrollable, true);
            const animateY = () => {
              const t    = verticalScrollTargets.current.get(vScrollable);
              const diff = t - vScrollable.scrollTop;
              if (Math.abs(diff) < 0.2) {
                vScrollable.scrollTop = t;
                isWheelScrollingY.current.set(vScrollable, false);
                verticalScrollTargets.current.delete(vScrollable);
              } else {
                vScrollable.scrollTop += diff * 0.15;
                requestAnimationFrame(animateY);
              }
            };
            requestAnimationFrame(animateY);
          }
        }
        return;
      }

      // 3. App shell horizontal scroll
      e.preventDefault();
      const shell = appShellRef.current;
      if (targetScrollX.current === null) targetScrollX.current = shell.scrollLeft;

      targetScrollX.current = Math.max(
        0,
        Math.min(targetScrollX.current + e.deltaY * 2.0, shell.scrollWidth - shell.clientWidth)
      );

      if (!isWheelScrollingX.current) {
        isWheelScrollingX.current = true;
        const animate = () => {
          if (!shell || targetScrollX.current === null) {
            isWheelScrollingX.current = false;
            return;
          }
          const diff = targetScrollX.current - shell.scrollLeft;
          if (Math.abs(diff) < 0.2) {
            shell.scrollLeft          = targetScrollX.current;
            isWheelScrollingX.current = false;
            targetScrollX.current     = null;
          } else {
            shell.scrollLeft += diff * 0.1;
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      }
    };

    const shell = appShellRef.current;
    if (shell) shell.addEventListener('wheel', handleWheel, { passive: false });
    return () => { if (shell) shell.removeEventListener('wheel', handleWheel); };
  }, [appShellRef]);

  return { scrollToTab };
}
