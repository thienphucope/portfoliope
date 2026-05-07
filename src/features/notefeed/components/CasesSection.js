import CaseItem from './CaseItem';

export default function CasesSection({ displayedCases, onLinkClick, loadedCount, totalCount, loading, onLoadMore }) {
  return (
    <section className="cases-section" id="cases">
      <div className="section-header reveal">
        <span className="section-number">The Dossier</span>
        <h2 className="section-title">Notable <span className="accent">Cases</span></h2>
        <div className="section-line" />
        <p className="section-desc">Just Blogs, My Dear Sidekicks!</p>
      </div>
      <div className="cases-timeline">
        {displayedCases.map((c) => (
          <CaseItem key={c.id} caseData={c} onLinkClick={onLinkClick} />
        ))}
      </div>
      {loadedCount < totalCount && (
        <div className="load-more-wrapper">
          <button className="load-more-btn" onClick={onLoadMore}>
            {loading ? 'Consulting Evidence...' : 'Load More Cases'} <span className="arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
}
