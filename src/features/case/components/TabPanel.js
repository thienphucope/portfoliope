import React from 'react';
import BlockEditor from './BlockEditor';
import { VolumeX } from 'lucide-react';

export default function TabPanel({
  tab,
  activeTab,
  handleTabClick,
  handleLinkClick,
  isEditing,
  handleToggleEditMode,
  saveStatus,
  handleSidebarSave,
  fileName,
  content,
  handleSaveFile,
  saveHandlerRef,
  fileRegistry,
  isAtBottom,
  setIsAtBottom,
  reader,
}) {
  const isOpen = activeTab === tab.id;
  const { stop, isPlaying } = reader;

  // TabPanel chỉ xử lý các tab editor hoặc static
  if (tab.type !== 'editor' && tab.type !== 'static') return null;

  return (
    <div
      className={`acc-panel ${isOpen ? 'open' : 'closed'} tab-${tab.id}`}
      data-tab-id={tab.id}
    >
      <div className="acc-spine-container" onClick={(e) => handleTabClick(tab, e)}>
        <div className="acc-spine">{tab.title}</div>
      </div>

      {isOpen && (
        <div
          className="acc-content"
          onClick={(e) => e.stopPropagation()}
        >
          {isPlaying && (
            <div 
              className="global-stop-reader"
              onClick={stop}
              title="Stop Reading"
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50%',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--colorbutton)',
                boxShadow: '0 0 15px var(--colorbutton)',
                animation: 'pulseStop 2s infinite'
              }}
            >
              <VolumeX size={24} color="var(--colorbutton)" />
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulseStop {
                  0% { box-shadow: 0 0 5px var(--colorbutton); }
                  50% { box-shadow: 0 0 20px var(--colorbutton); }
                  100% { box-shadow: 0 0 5px var(--colorbutton); }
                }
              `}} />
            </div>
          )}

          <div className="acc-body">
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
                  reader={reader}
                />
              </article>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
