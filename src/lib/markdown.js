/**
 * Utility module for Markdown rendering in the case vault application.
 * Handles loading of external libraries (Marked, Highlight.js, KaTeX, Mermaid),
 * configuration of Marked.js with custom extensions for wiki links, math, footnotes,
 * and post-processing for dynamic content like diagrams and equations.
 */

// ─── UTILS ────────────────────────────────────────────────────────────────────

export const loadScript = (src) => new Promise((resolve, reject) => {
  if (typeof document === 'undefined') return resolve();
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement('script');
  s.src = src; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

export const loadStyle = (href) => {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
};

// ─── MARKDOWN ENGINE ──────────────────────────────────────────────────────────

export const configureMarked = () => {
  if (typeof window === 'undefined' || !window.marked || window.markedConfigured) return;

  const renderer = new window.marked.Renderer();

  renderer.code = (token) => {
    const lang = token.lang || 'text';
    const code = token.text;
    if (lang === 'mermaid') return `<div class="mermaid">${code}</div>`;
    let highlighted = code;
    if (window.hljs) {
      try {
        highlighted = window.hljs.getLanguage(lang)
          ? window.hljs.highlight(code, { language: lang }).value
          : window.hljs.highlightAuto(code).value;
      } catch (e) {}
    }
    return `<div class="code-block"><span class="code-lang-label">${lang}</span><pre><code class="hljs language-${lang}">${highlighted}</code></pre></div>`;
  };

  renderer.heading = (token) => {
    const level = token.depth;
    const text = window.marked.parseInline(token.text);
    return `<h${level}>${text}</h${level}>`;
  };

  renderer.image = (token) => {
    const { href = '', title, text } = token;
    const ytMatch = href.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch) return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen></iframe></div>`;
    if (href.endsWith('#circle')) return `<img src="${href.replace('#circle', '')}" alt="${text || ''}" class="img-circle">`;
    return `<img src="${href}" alt="${text || ''}" title="${title || ''}">`;
  };

  window.marked.use({
    renderer,
    extensions: [
      { name: 'math', level: 'inline',
        start(src) { return src.match(/\$/)?.index; },
        tokenizer(src) {
          const b = /^\$\$([\s\S]+?)\$\$/.exec(src);
          if (b) return { type: 'math', raw: b[0], text: b[1], displayMode: true };
          const i = /^\$((?:\\\$|[^$])+)\$/.exec(src);
          if (i) return { type: 'math', raw: i[0], text: i[1], displayMode: false };
        },
        renderer(t) { return t.displayMode ? `<div class="math-block">$$\n${t.text}\n$$</div>` : `<span class="math-inline">$${t.text}$</span>`; }
      },
      { name: 'footnote', level: 'inline',
        start(src) { return src.match(/\[\^/)?.index; },
        tokenizer(src) { const m = /^\[\^([^\]]+)\]/.exec(src); if (m) return { type: 'footnote', raw: m[0], id: m[1] }; },
        renderer(t) { return `<sup class="fn-ref"><a href="#fn-${t.id}" id="fnref-${t.id}">${t.id}</a></sup>`; }
      },
      { name: 'footnoteDef', level: 'block',
        start(src) { return src.match(/^\[\^/)?.index; },
        tokenizer(src) { const m = /^\[\^([^\]]+)\]:\s+(.*)/.exec(src); if (m) return { type: 'footnoteDef', raw: m[0], id: m[1], text: m[2] }; },
        renderer(t) { return `<div class="footnote-item" id="fn-${t.id}"><a href="#fnref-${t.id}" class="fn-back">↩</a> <span class="fn-id">${t.id}:</span> ${t.text}</div>`; }
      },
      { name: 'wikiLink', level: 'inline',
        start(src) { return src.match(/\[\[/)?.index; },
        tokenizer(src) { const m = /^\[\[(.*?)\]\]/.exec(src); if (m) return { type: 'wikiLink', raw: m[0], text: m[1] }; },
        renderer(t) { return `<span class="internal-link" data-target="${t.text}">${t.text}</span>`; }
      },
      { name: 'detailsBlock', level: 'block',
        start(src) { return src.match(/<details/)?.index; },
        tokenizer(src) {
          const m = /^<details[\s\S]*?<\/details>/.exec(src);
          if (m) return { type: 'detailsBlock', raw: m[0] };
        },
        renderer(t) { 
          const match = t.raw.match(/<details([^>]*)>([\s\S]*?)<\/details>/i);
          if (match) {
            const attrs = match[1];
            const content = match[2];
            return `<details${attrs}>${window.marked.parse(content)}</details>`;
          }
          return t.raw; 
        }
      },
    ],
    gfm: true, breaks: true,
  });

  window.markedConfigured = true;
};

// ─── SINGLETON LIB LOADER ─────────────────────────────────────────────────────

let _libsPromise = null;
export const ensureLibsLoaded = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (_libsPromise) return _libsPromise;
  _libsPromise = Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'),
    loadStyle('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'),
    loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'),
    loadStyle('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'),
    loadScript('https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js'),
  ])
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'))
    .then(() => {
      if (window.mermaid) window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      configureMarked();
    });
  return _libsPromise;
};

// ─── DOM POST-PROCESSING (KaTeX + Mermaid) ───────────────────────────────────

export const fitHeading = (el, maxSize = 500) => {
  if (!el || !el.parentElement) return;
  const parent = el.parentElement;
  
  const run = () => {
    const parentRect = parent.getBoundingClientRect();
    if (parentRect.width <= 0) return;

    const style = window.getComputedStyle(parent);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const availableWidth = parentRect.width - paddingX - 1; // 1px margin of error

    // Save current styles to restore later if needed
    const originalDisplay = el.style.display;
    const originalWidth = el.style.width;
    const originalWhiteSpace = el.style.whiteSpace;

    // Set styles for measurement
    el.style.display = 'inline-block';
    el.style.width = 'auto';
    el.style.whiteSpace = 'nowrap';

    let low = 12;
    let high = maxSize;
    let best = low;

    // Binary search with sub-pixel precision
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      el.style.fontSize = mid + 'px';
      
      // Use getBoundingClientRect().width for sub-pixel accuracy
      if (el.getBoundingClientRect().width <= availableWidth) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    el.style.fontSize = best + 'px';

    // Restore layout styles
    el.style.display = originalDisplay || 'inline-block';
    el.style.width = originalWidth || 'auto';
    el.style.whiteSpace = originalWhiteSpace || 'nowrap';
  };

  run();
};

export const postProcess = (el) => {
  if (!el) return;
  el.querySelectorAll('table:not(.table-editor)').forEach(table => {
    if (!table.closest('.table-container')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'table-container';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
      throwOnError: false,
    });
  }
  const nodes = el.querySelectorAll('.mermaid:not([data-processed="true"])');
  if (window.mermaid && nodes.length) window.mermaid.run({ nodes });
  el.querySelectorAll('h6.fit-heading').forEach(fitHeading);
};
