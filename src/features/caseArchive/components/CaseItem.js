"use client";
import { useRef, useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { postProcess } from '@/lib/markdown';

// Case labels in Greek, bijective base-24 (α, β … ω, then αα, αβ …) for a little mystery.
const GREEK = 'αβγδεζηθικλμνξοπρστυφχψω';
function greekLabel(n) {
  let s = '';
  while (n > 0) {
    n -= 1;
    s = GREEK[n % 24] + s;
    n = Math.floor(n / 24);
  }
  return s;
}

export default function CaseItem({ caseData, index, onLinkClick }) {
  const contentRef = useRef(null);
  const [failedSource, setFailedSource] = useState(null);
  useEffect(() => {
    if (contentRef.current) postProcess(contentRef.current);
  }, [caseData.descriptionHtml]);

  const mediaSrc = caseData.media
    ? caseData.media.type === 'youtube'
      ? `https://img.youtube.com/vi/${caseData.media.videoId}/mqdefault.jpg`
      : caseData.media.url
    : null;

  return (
    <article className="nf-case reveal">
      <button type="button" className="nf-case-img" onClick={() => onLinkClick(caseData.id)} aria-label={`Read ${caseData.displayTitle}`}>
        {mediaSrc && failedSource !== mediaSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={mediaSrc} alt="" loading="lazy" onError={() => setFailedSource(mediaSrc)} />
        ) : <span className="nf-case-placeholder" aria-hidden="true">{greekLabel(index + 1)}</span>}
      </button>
      <div className="nf-case-copy">
        <div className="nf-case-meta"><span className="nf-case-date">{caseData.formattedDate}</span>{caseData.tag && <span className="nf-case-tag">{caseData.tag}</span>}</div>
        <h3 className="nf-case-title"><button type="button" onClick={() => onLinkClick(caseData.id)}>{caseData.displayTitle}</button></h3>
        <div ref={contentRef} className="nf-case-excerpt markdown-content" dangerouslySetInnerHTML={{ __html: caseData.descriptionHtml }} />
        {caseData.author && <span className="nf-case-author">written by {caseData.author}</span>}
      </div>
      <button type="button" className="nf-case-read" onClick={() => onLinkClick(caseData.id)} aria-label={`Examine dossier: ${caseData.displayTitle}`}><ArrowUpRight size={19} strokeWidth={1.4} aria-hidden="true" /></button>
    </article>
  );
}
