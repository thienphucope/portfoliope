import CaseItem from './CaseItem';

export default function CasesSection({ displayedCases, onLinkClick, loadedCount, totalCount, loading, onLoadMore }) {
  return (
    <section className="nf-cases" id="cases">
      <div className="nf-case-list">
        {displayedCases.map((c) => (
          <CaseItem key={c.id} caseData={c} onLinkClick={onLinkClick} />
        ))}
      </div>
      {loadedCount < totalCount && (
        <button className="nf-load-more" onClick={onLoadMore}>
          {loading ? 'Consulting Evidence...' : 'Load More Cases →'}
        </button>
      )}
    </section>
  );
}
