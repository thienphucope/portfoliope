import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Chat from './Chat';
import BlockEditor from './BlockEditor';
import FileSystemItem from './FileSystemItem';
import FloatingActions from './FloatingActions';
import dynamic from 'next/dynamic';

/**
 * Tab panel container component for rendering different content types in the case vault,
 * including file tree, chat, static content, and editable notes with block editor.
 */

const GraphView = dynamic(() => import('./GraphView'), { ssr: false });

export default function TabPanel({
  tab,
  activeTab,
  setActiveTab,
  activeOverlay,
  setActiveOverlay,
  handleTabClick,
  handleLinkClick,
  isEditing,
  handleToggleEditMode,
  saveStatus,
  handleSidebarSave,
  viewMode,
  setViewMode,
  showSearch,
  setShowSearch,
  searchTerm,
  setSearchTerm,
  filteredTree,
  loadFile,
  fileName,
  handleRenameFile,
  handleDeleteFile,
  graphFiles,
  fullContentCache,
  contentKey,
  content,
  handleSaveFile,
  saveHandlerRef,
  fileRegistry,
  isAtBottom,
  setIsAtBottom,
  handleAppendComment,
}) {
  const isOverlay = tab.id === 'filetree' || tab.id === 'chat';
  const isOpen = isOverlay ? activeOverlay === tab.id : activeTab === tab.id;
  const isPersistent = tab.id === 'chat' || tab.id === activeTab;

  return (
    <div
      className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-${tab.id}`}
      data-tab-id={tab.id}
    >
      <div className="acc-spine-container" onClick={(e) => handleTabClick(tab, e)}>
        <div className="acc-spine">{tab.title}</div>
        {isOpen && (
          <div
            className="tab-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              // Gọi handleTabClick với tab hiện tại khi nó đang mở 
              // sẽ kích hoạt logic đóng tab và đẩy URL về /case
              handleTabClick(tab, e);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 17 5-5-5-5"></path>
              <path d="M21 12H9"></path>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            </svg>
          </div>
        )}
      </div>

      {(isOpen || isPersistent) && (
        <div
          className="acc-content"
          onClick={(e) => e.stopPropagation()}
          style={!isOpen ? { display: 'none' } : {}}
        >
          <FloatingActions
            tab={tab}
            isEditing={isEditing}
            handleToggleEditMode={handleToggleEditMode}
            saveStatus={saveStatus}
            handleSidebarSave={handleSidebarSave}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <div className="acc-body">
            {tab.type === 'sidebar' && (
              <>
                {viewMode === 'list' ? (
                  <div className="file-list" style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                    {filteredTree.map((item, i) => (
                      <FileSystemItem
                        key={i}
                        item={item}
                        onSelectFile={loadFile}
                        activeFile={fileName}
                        onRename={handleRenameFile}
                        onDelete={handleDeleteFile}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <GraphView
                      allFiles={graphFiles}
                      onSelectFile={loadFile}
                      searchTerm={searchTerm}
                      activeNodeId={fileName}
                      fullContentCache={fullContentCache}
                    />
                  </div>
                )}
              </>
            )}

            {tab.type === 'chat' && (
              <div className="chat-container" style={{ flex: 1, overflow: 'hidden' }}>
                <Chat isEmbedded={true} onLinkClick={handleLinkClick} />
              </div>
            )}

            {(tab.type === 'static' || tab.type === 'editor') && (
              <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <article
                  className="markdown-container"
                  style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                  onScroll={(e) => {
                    const t = e.target;
                    const bottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 100;
                    if (bottom !== isAtBottom) setIsAtBottom(bottom);
                  }}
                >
                  <BlockEditor
                    content={content}
                    fileName={fileName}
                    onLinkClick={handleLinkClick}
                    onSaveFile={handleSaveFile}
                    isEditing={tab.type === 'editor' ? isEditing : false}
                    readOnly={tab.type === 'static'}
                    onToggleEditing={handleToggleEditMode}
                    onSaveRef={saveHandlerRef}
                    fileRegistry={fileRegistry.current}
                  />
                </article>
              </main>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
