'use client';

import { useRef, useCallback, useLayoutEffect } from 'react';
import { postProcess } from '@/lib/markdown';

export const cleanAssistantOutput = (txt) => {
  if (!txt) return '';
  const cleaned = txt.trim();
  const taggedWrapper = cleaned.match(/^```(?:html|md|markdown|text)\s*\n([\s\S]*?)\n```$/i);
  if (taggedWrapper) return taggedWrapper[1].trim();
  const htmlWrapper = cleaned.match(/^```\s*\n([\s\S]*?)\n```$/i);
  if (htmlWrapper && /<\/?[a-z][\s\S]*>/i.test(htmlWrapper[1])) return htmlWrapper[1].trim();
  return cleaned;
};

export const renderAssistantContent = (txt, markdownReady) => {
  const cleaned = cleanAssistantOutput(txt);
  if (!cleaned) return '';
  if (!markdownReady || typeof window === 'undefined' || !window.marked) return cleaned;
  try {
    return window.marked.parse(cleaned);
  } catch {
    return cleaned;
  }
};

export const extractSpeechText = (content, markdownReady) => {
  if (!content) return '';
  const withBreaks = renderAssistantContent(content, markdownReady)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|section|article|blockquote)>/gi, ' ');
  const normalize = (text) => text.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1').trim().toLowerCase();

  if (typeof DOMParser === 'undefined') {
    return normalize(withBreaks.replace(/<[^>]+>/g, ' '));
  }

  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  doc.querySelectorAll('script, style, iframe, img, video, audio').forEach(el => el.remove());
  return normalize(doc.body.textContent || '');
};

const createLinkPayload = (target, element) => ({
  target: element,
  preventDefault: () => {},
  replace: (...args) => target.replace(...args),
  toString: () => target,
  valueOf: () => target,
});

export const ChatMarkdownContent = ({ content, markdownReady, onLinkClick, isStreaming }) => {
  const contentRef = useRef(null);
  const html = renderAssistantContent(content, markdownReady);

  useLayoutEffect(() => {
    if (contentRef.current && markdownReady) postProcess(contentRef.current);
  }, [html, markdownReady, isStreaming]);

  const handleClick = useCallback((e) => {
    const a = e.target.closest('a[href]');
    if (a && onLinkClick) {
      const href = a.getAttribute('href');
      // Allow normal browser behavior for external links
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return;
      }
      e.preventDefault();
      onLinkClick(createLinkPayload(href, a));
      return;
    }

    const internalLink = e.target.closest('.internal-link');
    if (internalLink && onLinkClick) {
      e.preventDefault();
      const target = internalLink.getAttribute('data-target') || internalLink.innerText;
      onLinkClick(createLinkPayload(target, internalLink));
    }
  }, [onLinkClick]);

  return (
    <div
      ref={contentRef}
      className="bubble-content html-content block-content markdown-content block-view"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
};
