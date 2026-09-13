import { useState, useMemo } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import CaseItem from './CaseItem';

export default function CasesSection({ displayedCases, onLinkClick, loadedCount, totalCount, loading, onLoadMore, searchTerm, setSearchTerm }) {
  const [showAll, setShowAll] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

  // Chips come from whatever's loaded; clicking one filters the list client-side.
  const tags = useMemo(
    () => [...new Set(displayedCases.map((c) => c.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [displayedCases]
  );

  const byTag = selectedTag ? displayedCases.filter((c) => c.tag === selectedTag) : displayedCases;
  const expanded = showAll || Boolean(searchTerm.trim()) || Boolean(selectedTag);
  const visibleCases = expanded ? byTag : byTag.slice(0, 3);

  return (
    <section className="nf-cases" id="cases" aria-labelledby="latest-writing-title">
      <div className="nf-section-heading">
        <h2 id="latest-writing-title">Latest Cases</h2>
        <button type="button" className="nf-text-link" onClick={() => setShowAll(!showAll)} aria-expanded={showAll} aria-controls="writing-list">
          {showAll ? 'Latest three' : 'All cases'} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="nf-search-row" role="search">
        <Search size={16} strokeWidth={1.5} aria-hidden="true" />
        <input id="archive-search" type="search" className="nf-search-input" aria-label="Search evidence" placeholder="Search the archives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && <button type="button" className="nf-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear search"><X size={16} /></button>}
      </div>
      {tags.length > 0 && (
        <div className="nf-tag-filter" role="group" aria-label="Filter by tag">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className={`nf-tag-chip${selectedTag === t ? ' is-active' : ''}`}
              aria-pressed={selectedTag === t}
              onClick={() => setSelectedTag(selectedTag === t ? null : t)}
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      <div id="writing-list" className="nf-case-list" aria-busy={loading}>
        {visibleCases.length > 0 ? visibleCases.map((c, i) => <CaseItem key={c.id} caseData={c} index={i} onLinkClick={onLinkClick} />) : (
          <div className="nf-no-cases" role="status">{loading ? 'Consulting archives...' : 'No matching evidence found.'}</div>
        )}
      </div>
      {expanded && !selectedTag && loadedCount < totalCount && <button type="button" className="nf-load-more" onClick={onLoadMore} disabled={loading}>{loading ? 'Consulting Evidence...' : 'Load more cases'} <ArrowRight size={16} aria-hidden="true" /></button>}
    </section>
  );
}
