"use client";
import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import yaml from 'js-yaml';

export default function Page2() {
  const owner = 'thienphucope';
  const repo = 'portfoliope';
  const branch = 'main';
  const [images, setImages] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [contentHTML, setContentHTML] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [rawContent, setRawContent] = useState('');
  const [token, setToken] = useState(process.env.NEXT_PUBLIC_GITHUB_TOKEN || '');
  const [currentFrontmatter, setCurrentFrontmatter] = useState({});
  const [pendingImages, setPendingImages] = useState({ thumbnail: null, full: null });
  const [imagePreviews, setImagePreviews] = useState({ thumbnail: null, full: null });
  const thumbRef = useRef(null);
  const fullRef = useRef(null);

  const parseFrontmatterAndContent = (text) => {
    const frontmatterMatch = text.match(/---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('No valid frontmatter found');
    }
    const frontmatter = yaml.load(frontmatterMatch[1]);
    const endOfFrontmatter = frontmatterMatch[0].length;
    const content = text.slice(endOfFrontmatter).trim();
    return { frontmatter, content };
  };

  const updateFrontmatterField = (field, value) => {
    try {
      const { frontmatter, content } = parseFrontmatterAndContent(rawContent);
      frontmatter[field] = value;
      const newFrontmatterStr = yaml.dump(frontmatter);
      const newRawContent = `---\n${newFrontmatterStr}\n---\n\n${content}`;
      setRawContent(newRawContent);
      setCurrentFrontmatter(frontmatter);
    } catch (e) {
      console.error('Error updating frontmatter:', e);
    }
  };

  const normalizeTitle = (title) => {
    if (!title) return '';
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // remove non-alnum except space
      .trim()
      .replace(/\s+/g, '_'); // multiple spaces to single _
  };

  useEffect(() => {
    if (selectedItem && !editMode) {
      setCurrentFrontmatter({
        title: selectedItem.title || '',
        description: selectedItem.description || '',
        image: selectedItem.image || '/default-image.gif',
        fullImage: selectedItem.fullImage || '/default-full.jpg',
        id: selectedItem.id
      });
    } else if (editMode && rawContent) {
      try {
        const { frontmatter } = parseFrontmatterAndContent(rawContent);
        setCurrentFrontmatter(frontmatter || {});
      } catch (e) {
        console.error('YAML parse error:', e);
        setCurrentFrontmatter({});
      }
    } else {
      setCurrentFrontmatter({});
    }
  }, [selectedItem, editMode, rawContent]);

  useEffect(() => {
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
    if (selectedItem && selectedItem.content && !selectedItem.isNew) {
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
          try {
            const { content } = parseFrontmatterAndContent(fullMdText);
            setContentHTML(marked(content));
          } catch (e) {
            console.error('Error parsing for render:', e);
            setContentHTML(marked(fullMdText));
          }
        })
        .catch(error => {
          console.error('Error loading Markdown content:', error);
          setContentHTML('<p>Error loading content.</p>');
          setRawContent('# Error loading content');
        });
    } else if (selectedItem?.isNew) {
      setRawContent(`---\ntitle: \ndescription: \nimage: /default-image.gif\nfullImage: /default-full.jpg\n---\n\n`);
      setContentHTML('');
    } else {
      setContentHTML('');
      setRawContent('');
    }
    setPendingImages({ thumbnail: null, full: null });
    setImagePreviews({ thumbnail: null, full: null });
  }, [selectedItem]);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      if (selectedItem.isNew) setEditMode(true);
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

  const handleAddNew = () => {
    const newId = 'new-' + Date.now();
    setSelectedItem({
      id: newId,
      title: '',
      description: '',
      image: '/default-image.gif',
      fullImage: '/default-full.jpg',
      content: '',
      path: '',
      rawUrl: '',
      isNew: true
    });
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

  const handleThumbUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const timestamp = Date.now();
    const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
    const ext = file.name.split('.').pop();
    const imgName = `${nameWithoutExt}-${timestamp}.${ext}`;
    const previewUrl = URL.createObjectURL(file);
    setPendingImages(prev => ({ ...prev, thumbnail: file }));
    setImagePreviews(prev => ({ ...prev, thumbnail: previewUrl }));
    updateFrontmatterField('image', `/${imgName}`);
  };

  const handleFullUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const timestamp = Date.now();
    const nameWithoutExt = file.name.split('.').slice(0, -1).join('.');
    const ext = file.name.split('.').pop();
    const imgName = `${nameWithoutExt}-${timestamp}.${ext}`;
    const previewUrl = URL.createObjectURL(file);
    setPendingImages(prev => ({ ...prev, full: file }));
    setImagePreviews(prev => ({ ...prev, full: previewUrl }));
    updateFrontmatterField('fullImage', `/${imgName}`);
  };

  const uploadImage = async (file, imgName, currentToken) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const imgPath = `public/${imgName}`;

    const putResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${imgPath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${currentToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload image ${imgName}`,
        content: base64,
        branch
      }),
    });

    if (!putResponse.ok) {
      const errorData = await putResponse.json().catch(() => ({}));
      throw new Error(`Failed to upload image: ${errorData.message || 'Unknown error'}`);
    }

    return `/${imgName}`;
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

    let parsedFrontmatter;
    let content;
    try {
      const parseResult = parseFrontmatterAndContent(rawContent);
      parsedFrontmatter = parseResult.frontmatter;
      content = parseResult.content;
    } catch (parseErr) {
      alert('Invalid YAML frontmatter. Please check formatting (e.g., add space after colons like "key: value"). Error: ' + parseErr.message);
      return;
    }

    const isNewItem = selectedItem.isNew;

    if (isNewItem && !parsedFrontmatter.title?.trim()) {
      alert('Title is required for new item.');
      return;
    }

    if (isNewItem && !parsedFrontmatter.id) {
      parsedFrontmatter.id = Math.random().toString(36).substr(2, 9);
    }

    // Upload pending images if any
    try {
      if (pendingImages.thumbnail) {
        const imgName = parsedFrontmatter.image.slice(1);
        await uploadImage(pendingImages.thumbnail, imgName, currentToken);
      }
      if (pendingImages.full) {
        const imgName = parsedFrontmatter.fullImage.slice(1);
        await uploadImage(pendingImages.full, imgName, currentToken);
      }
    } catch (uploadErr) {
      alert('Error uploading images: ' + uploadErr.message);
      return;
    }

    const fullFrontmatterStr = yaml.dump(parsedFrontmatter);
    const mdContent = `---\n${fullFrontmatterStr}\n---\n\n${content}`;

    let filePath;
    let sha;
    const slug = isNewItem 
      ? normalizeTitle(parsedFrontmatter.title.trim())
      : selectedItem.path;

    if (!slug && isNewItem) {
      alert('Invalid title for filename.');
      return;
    }

    filePath = `public/${isNewItem ? `${slug}.md` : selectedItem.path}`;

    if (isNewItem) {
      // Check if exists
      try {
        const checkResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: {
            'Authorization': `token ${currentToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (checkResponse.ok) {
          alert('A file with this title already exists. Please choose a different title.');
          return;
        }
      } catch (err) {
        if (!err.message.includes('404')) {
          console.error(err);
        }
      }
    } else {
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
      sha = fileData.sha;
    }

    const base64Content = btoa(unescape(encodeURIComponent(mdContent)));

    const putBody = {
      message: isNewItem ? 'Create new case via app' : 'Update case content via app',
      content: base64Content,
      ...(isNewItem ? { branch } : { sha }),
    };

    const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${currentToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (updateResponse.ok) {
      alert('Saved successfully! Check repo for changes.');
      const updatedItem = {
        ...selectedItem,
        title: parsedFrontmatter.title,
        description: parsedFrontmatter.description,
        image: parsedFrontmatter.image,
        fullImage: parsedFrontmatter.fullImage,
        id: parsedFrontmatter.id,
        isNew: undefined
      };
      if (isNewItem) {
        const newRawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        const newItem = { ...updatedItem, path: `${slug}.md`, content: newRawUrl, rawUrl: newRawUrl };
        setImages(prev => [...prev, newItem]);
        setSelectedItem(newItem);
      } else {
        setSelectedItem(updatedItem);
      }
      setEditMode(false);
      setContentHTML(marked(content));
      // Cleanup previews
      Object.values(imagePreviews).forEach(url => URL.revokeObjectURL(url));
      setPendingImages({ thumbnail: null, full: null });
      setImagePreviews({ thumbnail: null, full: null });
    } else {
      const errorData = await updateResponse.json().catch(() => ({})); // Fallback if not JSON
      console.error('Update error details:', errorData);
      if (updateResponse.status === 403) {
        throw new Error(`403 Forbidden: Token lacks 'Contents: Write' permission for this repo. Regenerate fine-grained token with Write access to ${owner}/${repo}. Docs: ${errorData.documentation_url}`);
      }
      throw new Error(`Failed to save: ${updateResponse.status} - ${errorData.message || 'Unknown error'}`);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    if (selectedItem?.isNew) {
      setSelectedItem(null);
    }
    // Cleanup previews
    Object.values(imagePreviews).forEach(url => URL.revokeObjectURL(url));
    setPendingImages({ thumbnail: null, full: null });
    setImagePreviews({ thumbnail: null, full: null });
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredericka+the+Great&display=swap');
      `}</style>
      <style jsx>{`
        #page2 {
          font-family: 'Fredericka the Great', cursive;
        }

        .font-fredericka {
          font-family: 'Fredericka the Great', cursive;
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

        .clickable-img {
          cursor: pointer;
          opacity: 0.8;
        }

        .clickable-img:hover {
          opacity: 1;
          transform: scale(1.05);
          transition: transform 0.2s;
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1.5rem;
        }
      `}</style>

      <section id="page2" className="w-full min-h-screen bg-[var(--background)] snap-start font-fredericka box-border relative z-10 flex justify-center items-center p-4">
        <div className="w-[89vw] flex flex-col items-center">
          <h1 className="text-[var(--colorthree)] text-8xl font-bold mb-8 w-full text-center font-fredericka">CASE ARCHIVES</h1>
          
          <div 
            className="w-full h-auto min-h-[90vh] columns-4 gap-4"
          >
            {images.map((imageItem) => (
              <div
                key={imageItem.id}
                className="masonry-item bg-[var(--colortwo)] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 border-16 border-[var(--colortwo)]"
                onClick={() => handleCardClick(imageItem)}
              >
                <div className="w-full h-auto overflow-hidden">
                  <img
                    src={imageItem.image}
                    alt={`Image ${imageItem.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 flex flex-col justify-start">
                  <h3 className="text-xl text-[var(--colorone)] font-bold font-fredericka">{imageItem.title}</h3>
                  <p className="text-lg text-[var(--colorone)] font-fredericka">{imageItem.description}</p>
                </div>
              </div>
            ))}
            <div
              className="masonry-item bg-[var(--colorone)] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col cursor-pointer transition-all duration-300 border-16 border-[var(--colorthree)]"
              onClick={handleAddNew}
            >
              <div className="w-full aspect-square flex-shrink-0 flex items-center justify-center bg-[var(--colorone)]">
                <h2 className="text-9xl text-[var(--colorthree)] font-bold font-fredericka">+</h2>
              </div>
              <div className="flex-1 p-6 bg-[var(--colorthree)] flex flex-col justify-center items-center">
                <h3 className="text-2xl text-[var(--colorone)] font-bold font-fredericka">ADD NEW CASE</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file inputs */}
        {selectedItem && editMode && (
          <>
            <input
              ref={thumbRef}
              type="file"
              accept="image/*"
              onChange={handleThumbUpload}
              className="hidden"
            />
            <input
              ref={fullRef}
              type="file"
              accept="image/*"
              onChange={handleFullUpload}
              className="hidden"
            />
          </>
        )}

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
              <div className="w-full h-48 overflow-hidden relative">
                <img
                  src={imagePreviews.full || currentFrontmatter.fullImage || '/default-full.jpg'}
                  alt={currentFrontmatter.title || selectedItem.title}
                  className={`w-full h-full object-cover ${editMode ? 'clickable-img' : ''}`}
                  onClick={editMode ? () => fullRef.current?.click() : undefined}
                />
              </div>
              {/* Title Section */}
              <div className="p-6 relative">
                <div className="flex justify-between items-center">
                  <div className={`absolute left-24 top-[-4.5rem] w-40 h-40 overflow-hidden z-10 ${editMode ? 'clickable-img cursor-pointer' : ''}`}>
                    <img
                      src={imagePreviews.thumbnail || currentFrontmatter.image || '/default-image.gif'}
                      alt=""
                      className="w-full h-full object-cover"
                      onClick={editMode ? () => thumbRef.current?.click() : undefined}
                    />
                  </div>
                  <div className="flex-1 pl-48 text-center">
                    <h2 className="text-5xl text-[var(--colorone)] font-bold mb-2 font-fredericka">{currentFrontmatter.title || selectedItem.title}</h2>
                  </div>
                  <div className="flex gap-2">
                    {!editMode && (
                      <button className="action-btn font-fredericka" onClick={handleEditToggle}>
                        Edit
                      </button>
                    )}
                    {editMode && (
                      <>
                        <button className="action-btn save-btn font-fredericka" onClick={handleSave}>
                          Save
                        </button>
                        <button className="action-btn cancel-btn font-fredericka" onClick={handleCancel}>
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Description Section */}
              {!editMode && (
                <div className="px-6 pb-6">
                  <p className="text-xl text-center text-[var(--colorone)] italic font-fredericka">{currentFrontmatter.description || selectedItem.description}</p>
                </div>
              )}
              {/* Main Content Section */}
              <div 
                className="px-6 pb-6 text-2xl markdown-content max-w-none text-[var(--colorone)] leading-relaxed font-fredericka"
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