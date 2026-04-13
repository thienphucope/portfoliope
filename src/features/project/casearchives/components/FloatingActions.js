import React from 'react';
import { Share2, Search } from 'lucide-react';

/**
 * Floating actions toolbar component for the case vault, providing editor controls
 * (edit/save) and sidebar tools (graph/list toggle, search) based on active tab type.
 */

export default function FloatingActions({
  tab,
  isEditing,
  handleToggleEditMode,
  saveStatus,
  handleSidebarSave,
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm
}) {
  if (tab.id === 'filetree') {
    return (
      <div className="floating-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className={`icon-btn ${viewMode === 'graph' ? 'icon-btn--active' : ''}`}
          onClick={() => setViewMode(viewMode === 'list' ? 'graph' : 'list')}
          title="Toggle Graph/List View"
        >
          <Share2 size={18} />
        </button>
        {showSearch && (
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="search-input"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--txt)',
              fontSize: '13px',
              outline: 'none',
              width: '150px'
            }}
          />
        )}
        <button 
          className={`icon-btn ${showSearch ? 'icon-btn--active' : ''}`} 
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) setSearchTerm('');
          }}
          title="Search notes"
        >
          <Search size={18} />
        </button>
      </div>
    );
  }

  return null;
}
