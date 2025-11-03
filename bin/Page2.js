"use client";
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import yaml from 'js-yaml';

export default function Page2() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const owner = 'thienphucope';
    const repo = 'portfoliope';
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents/public`)
      .then(response => response.json())
      .then(files => {
        const mdFiles = files.filter(f => f.name.endsWith('.md') && !f.name.startsWith('.')); // Filter .md files
        const promises = mdFiles.map(file =>
          fetch(file.download_url)
            .then(response => response.text())
            .then(text => {
              const frontmatterMatch = text.match(/---\s*\n([\s\S]*?)\n---/);
              const frontmatter = frontmatterMatch ? yaml.load(frontmatterMatch[1]) : {};
              const contentStart = frontmatterMatch ? text.indexOf('---', frontmatterMatch[0].length) + 3 : 0;
              const content = text.slice(contentStart).trim();
              return {
                id: frontmatter.id || Math.random().toString(36).substr(2, 9), // Fallback ID
                title: frontmatter.title || file.name.replace('.md', '').replace(/-/g, ' ').toUpperCase(),
                description: frontmatter.description || '',
                image: frontmatter.image || '/default-image.gif',
                fullImage: frontmatter.fullImage || '/default-full.jpg',
                content: file.download_url, // Raw URL for fetching full MD
                path: file.name, // Filename for saving
                rawUrl: file.download_url
              };
            })
        );
        return Promise.all(promises);
      })
      .then(setImages)
      .catch(error => console.error('Error loading cases:', error));
  }, []);

  const [selectedItem, setSelectedItem] = useState(null);
  const [contentHTML, setContentHTML] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [rawContent, setRawContent] = useState('');
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_GITHUB_TOKEN || '');

  // Configure marked to mimic GitHub's GFM rendering (better headers, newlines, tables, etc.)
  useEffect(() => {
    marked.setOptions({
      gfm: true,          // Enable GitHub Flavored Markdown
      breaks: true,       // Treat single newlines as <br> for better spacing
      headerIds: true,    // Add IDs to headers for GitHub-like linking
      mangle: false,      // Don't mangle links/headers
      headerPrefix: '',   // No prefix for header IDs
      smartLists: true,   // Smart handling of lists
      smartypants: true,  // Typographic replacements like " -> "
      xhtml: false        // Output HTML5
    });
  }, []);

  // Fetch Markdown content when selectedItem changes
  useEffect(() => {
    if (selectedItem && selectedItem.content) {
      fetch(selectedItem.content)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load ${selectedItem.content}`);
          }
          return response.text();
        })
        .then(fullMdText => {
          setRawContent(fullMdText); // Full text for editing (includes frontmatter)

          // Strip frontmatter for rendering
          const frontmatterMatch = fullMdText.match(/---\s*\n([\s\S]*?)\n---/);
          let contentToRender = fullMdText;
          if (frontmatterMatch) {
            const endOfFrontmatter = frontmatterMatch[0].length;
            contentToRender = fullMdText.slice(endOfFrontmatter).trim();
          }
          setContentHTML(marked(contentToRender));
        })
        .catch(error => {
          console.error('Error loading Markdown content:', error);
          setContentHTML('<p>Error loading content.</p>');
          setRawContent('# Error loading content');
        });
    } else {
      setContentHTML('');
      setRawContent('');
    }
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      setEditMode(false);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedItem]);

  const handleCardClick = (item) => {
    setSelectedItem(item);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedItem(null);
      setEditMode(false);
    }
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
  };

  const handleSave = async () => {
    const password = prompt('Enter password to save:');
    if (password !== 'admin') {
      alert('Incorrect password!');
      return;
    }

    let currentToken = token;
    if (!currentToken) {
      currentToken = prompt('Enter GitHub Fine-grained Personal Access Token:');
      if (!currentToken) {
        alert('Token required!');
        return;
      }
      setToken(currentToken);
    }

    // Quick token validation (optional debug)
    try {
      const validateResponse = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `token ${currentToken}` }
      });
      if (!validateResponse.ok) {
        throw new Error('Invalid token: Check scopes (Contents: Write for fine-grained)');
      }
      console.log('Token validated OK');
    } catch (err) {
      alert('Token invalid: ' + err.message);
      return;
    }

    const mdContent = rawContent;

    const filePath = `public/${selectedItem.path}`; // e.g., 'public/the-fuckboy-allure.md'
    const owner = 'thienphucope';
    const repo = 'portfoliope';

    try {
      // Get current file to fetch SHA
      const getResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: {
          'Authorization': `token ${currentToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!getResponse.ok) {
        const errText = await getResponse.text();
        console.error('Fetch file error details:', errText);
        throw new Error(`Failed to fetch file: ${getResponse.status} ${getResponse.statusText} - ${errText}`);
      }

      const fileData = await getResponse.json();
      const sha = fileData.sha;

      // Encode new content as base64
      const base64Content = btoa(unescape(encodeURIComponent(mdContent)));

      // Update file
      const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${currentToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update case content via app',
          content: base64Content,
          sha: sha,
        }),
      });

      if (updateResponse.ok) {
        alert('Saved successfully! Check repo for changes.');
        setEditMode(false);
        setContentHTML(marked(mdContent)); // Update view
      } else {
        const errorData = await updateResponse.json().catch(() => ({})); // Fallback if not JSON
        console.error('Update error details:', errorData);
        if (updateResponse.status === 403) {
          throw new Error(`403 Forbidden: Token lacks 'Contents: Write' permission for this repo. Regenerate fine-grained token with Write access to ${owner}/${repo}. Docs: ${errorData.documentation_url}`);
        }
        throw new Error(`Failed to save: ${updateResponse.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error saving: ' + error.message);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  return (
    <>
      <style jsx>{`
        #page2 {
          font-family: 'Times New Roman', Times, serif;
        }

        .markdown-content :global(h1) {
          font-size: 2.5em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: var(--colorone);
          line-height: 1.2;
        }

        .markdown-content :global(h2) {
          font-size: 2em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: var(--colorone);
          line-height: 1.3;
        }

        .markdown-content :global(h3) {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: var(--colorone);
          line-height: 1.4;
        }

        .markdown-content :global(h4) {
          font-size: 1.25em;
          font-weight: bold;
          margin-top: 1.2em;
          margin-bottom: 0.4em;
          color: var(--colorone);
        }

        .markdown-content :global(p) {
          margin-top: 1em;
          margin-bottom: 1em;
          line-height: 1.8;
        }

        .markdown-content :global(strong) {
          font-weight: bold;
        }

        .markdown-content :global(em) {
          font-style: italic;
        }

        .markdown-content :global(ul),
        .markdown-content :global(ol) {
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 2em;
        }

        .markdown-content :global(li) {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
          line-height: 1.6;
        }

        .markdown-content :global(code) {
          background: #f4f4f4;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .markdown-content :global(pre) {
          background: #f4f4f4;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin-top: 1em;
          margin-bottom: 1em;
        }

        .markdown-content :global(pre code) {
          background: transparent;
          padding: 0;
        }

        .markdown-content :global(blockquote) {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin-left: 0;
          margin-top: 1em;
          margin-bottom: 1em;
          color: #666;
        }

        .markdown-content :global(a) {
          color: var(--colorthree);
          text-decoration: underline;
        }

        .markdown-content :global(hr) {
          border: none;
          border-top: 2px solid #ddd;
          margin-top: 2em;
          margin-bottom: 2em;
        }

        .markdown-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1em;
          margin-bottom: 1em;
        }

        .markdown-content :global(th),
        .markdown-content :global(td) {
          border: 1px solid #ddd;
          padding: 0.5em;
          text-align: left;
        }

        .markdown-content :global(th) {
          background: #f4f4f4;
          font-weight: bold;
        }

        .edit-content {
          width: 100%;
          min-height: 400px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 16px;
          line-height: 1.5;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          box-sizing: border-box;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          background: var(--colorone);
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
        }

        .action-btn:hover {
          background: var(--colorthree);
        }

        .save-btn {
          background: green;
        }

        .save-btn:hover {
          background: darkgreen;
        }

        .cancel-btn {
          background: red;
        }

        .cancel-btn:hover {
          background: darkred;
        }
      `}</style>

      <section id="page2" className="w-full min-h-screen bg-[var(--background)] snap-start font-serif box-border relative z-10 flex justify-center items-center p-4">
        <div className="w-[80vw] flex flex-col items-center">
          <h1 className="text-[var(--colorthree)] text-8xl font-bold mb-8 w-full text-center">🙢 CASE ARCHIVES 🙠</h1>
          
          <div 
            className="w-full h-[90vh] grid grid-cols-2 grid-rows-4 gap-6"
          >
            {images.map((imageItem) => (
              <div
                key={imageItem.id}
                className="bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex cursor-pointer transition-all duration-300"
                onClick={() => handleCardClick(imageItem)}
              >
                <div className="w-1/3 aspect-square flex-shrink-0 flex items-center justify-center">
                  <img
                    src={imageItem.image}
                    alt={`Image ${imageItem.id}`}
                    className="max-w-full max-h-full object-contain rounded-l-2xl"
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col justify-top">
                  <h3 className="text-3xl text-[var(--colorone)] font-bold mb-2">{imageItem.title}</h3>
                  <p className="text-lg text-[var(--colorone)]">{imageItem.description}</p>
                </div>
              </div>
            ))}
          
          </div>
          <h1 className="text-[var(--colorthree)] pt-15 text-8xl font-bold mb-8 w-full text-center">🙢 IN PROGRESS 🙠</h1>
        </div>

        {/* Modal */}
        {selectedItem && (
          <div 
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm flex justify-center items-start pt-0 z-50 p-4"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-[85vw] w-full max-h-[100vh] overflow-y-auto shadow-2xl no-scrollbar"
            >
              {/* Picture Section */}
              <div className="w-full h-48 overflow-hidden">
                <img
                  src={selectedItem.fullImage}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Title Section */}
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <h2 className="flex-1 text-5xl text-center text-[var(--colorone)] font-bold mb-2">{selectedItem.title}</h2>
                  <div className="flex gap-2">
                    {!editMode && (
                      <button className="action-btn" onClick={handleEditToggle}>
                        Edit
                      </button>
                    )}
                    {editMode && (
                      <>
                        <button className="action-btn save-btn" onClick={handleSave}>
                          Save
                        </button>
                        <button className="action-btn cancel-btn" onClick={handleCancel}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Description Section */}
              <div className="px-6 pb-6">
                <p className="text-xl text-center text-[var(--colorone)] italic">{selectedItem.description}</p>
              </div>
              {/* Main Content Section */}
              <div 
                className="px-6 pb-6 text-2xl markdown-content max-w-none text-[var(--colorone)] leading-relaxed"
              >
                {editMode ? (
                  <textarea
                    className="edit-content"
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: contentHTML }} />
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}