import { useEffect, useRef } from 'react';

export function useFeedEffects({ isMounted, displayedCases, libsReady, feedRef }) {
  const scrollRestoredRef = useRef(false);
  const autoScrollRef = useRef(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (displayedCases.length > 0 && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const savedPos = sessionStorage.getItem('notefeed_scroll_pos');
      if (savedPos && feedRef?.current) {
        requestAnimationFrame(() => { if (feedRef.current) feedRef.current.scrollTop = parseInt(savedPos, 10); });
      }
    }
  }, [displayedCases, feedRef]);

  useEffect(() => {
    if (!isMounted || !feedRef?.current) return;

    const feed = feedRef.current;

    const stopAutoScroll = () => {
      hasInteractedRef.current = true;
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
        autoScrollRef.current = null;
      }
      feed.removeEventListener('mouseenter', stopAutoScroll);
      feed.removeEventListener('touchstart', stopAutoScroll);
      feed.removeEventListener('wheel', stopAutoScroll);
      feed.removeEventListener('keydown', stopAutoScroll);
    };

    // Auto-scroll logic: discrete jumps like pressing Page Down
    const scrollStep = () => {
      if (!hasInteractedRef.current && feed) {
        // If we are close to the bottom, jump back to top, otherwise scroll down by roughly one viewport height
        if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 50) {
          feed.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Scroll down by 85% of the visible container height (leaving a little overlap for reading context)
          feed.scrollBy({ top: feed.clientHeight * 0.85, behavior: 'smooth' });
        }
      }
    };

    // Trigger a jump every 4.5 seconds
    autoScrollRef.current = setInterval(scrollStep, 4500);

    const handleScroll = () => {
      sessionStorage.setItem('notefeed_scroll_pos', feed.scrollTop.toString());
    };

    feed.addEventListener('mouseenter', stopAutoScroll);
    feed.addEventListener('touchstart', stopAutoScroll);
    feed.addEventListener('wheel', stopAutoScroll);
    feed.addEventListener('keydown', stopAutoScroll);
    feed.addEventListener('scroll', handleScroll);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.02 }
    );
    feed.querySelectorAll('.reveal').forEach((r) => observer.observe(r));

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      feed.removeEventListener('mouseenter', stopAutoScroll);
      feed.removeEventListener('touchstart', stopAutoScroll);
      feed.removeEventListener('wheel', stopAutoScroll);
      feed.removeEventListener('keydown', stopAutoScroll);
      feed.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [isMounted, displayedCases, libsReady, feedRef]);
}
