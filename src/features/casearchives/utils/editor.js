/**
 * Utility functions for the BlockEditor.
 * Logic for storage, cursor management, and markdown line types.
 */

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

export const cacheKey  = (name) => `vault_v3::${name}`;

export const readCache = (name) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(cacheKey(name)));
  } catch {
    return null;
  }
};

export const saveCache = (name, data) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(cacheKey(name), JSON.stringify(data));
  } catch {}
};

export const mkBlock = (raw = '', type = 'paragraph') => ({
  id: `b${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
  raw,
  type,
});

// ─── CURSOR HELPERS ───────────────────────────────────────────────────────────

export const cursorToEnd = (el) => {
  if (!el) return;
  el.focus();
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

// ─── LINE TYPE HELPERS ────────────────────────────────────────────────────────

export const getLineClass = (line) => {
  if (/^###### /.test(line)) return 'rte-h6';
  if (/^##### /.test(line))  return 'rte-h5';
  if (/^#### /.test(line))   return 'rte-h4';
  if (/^### /.test(line))    return 'rte-h3';
  if (/^## /.test(line))     return 'rte-h2';
  if (/^# /.test(line))      return 'rte-h1';
  if (/^[-*+] /.test(line))  return 'rte-ul';
  if (/^\d+\. /.test(line))  return 'rte-ol';
  if (/^> /.test(line))      return 'rte-blockquote';
  if (/^`{3}/.test(line))    return 'rte-codefence';
  if (/^---+$|^\*\*\*+$/.test(line.trim())) return 'rte-hr';
  return 'rte-p';
};

export const SLASH_COMMANDS = [
  { id: 'ai', label: 'AI Prompt', icon: 'AI', template: '/ai ' },
  { id: 'h1', label: 'Heading 1', icon: 'H1', template: '# ' },
  { id: 'h2', label: 'Heading 2', icon: 'H2', template: '## ' },
  { id: 'h3', label: 'Heading 3', icon: 'H3', template: '### ' },
  { id: 'h4', label: 'Heading 4', icon: 'H4', template: '#### ' },
  { id: 'h5', label: 'Heading 5', icon: 'H5', template: '##### ' },
  { id: 'h6', label: 'Heading 6', icon: 'H6', template: '###### ' },
  { id: 'bold', label: 'Bold', icon: 'B', template: '**Bold**' },
  { id: 'italic', label: 'Italic', icon: 'I', template: '*Italic*' },
  { id: 'quote', label: 'Quote', icon: '”', template: '> ' },
  { id: 'ul', label: 'Bullet List', icon: 'UL', template: '- ' },
  { id: 'ol', label: 'Numbered List', icon: 'OL', template: '1. ' },
  { id: 'todo', label: 'Todo List', icon: '☑', template: '- [ ] ' },
  { id: 'table2', label: 'Table (2x2)', icon: '田2', template: "| Col 1 | Col 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |" },
  { id: 'table3', label: 'Table (3x2)', icon: '田3', template: "| Col 1 | Col 2 | Col 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |" },
  { id: 'code', label: 'Code Block', icon: '</>', template: "```\n\n```" },
  { id: 'icode', label: 'Inline Code', icon: '`', template: '`code` ' },
  { id: 'link', label: 'Link', icon: '🔗', template: '[Title](url)' },
  { id: 'img', label: 'Image', icon: '🖼', template: '![Alt](url)' },
  { id: 'math', label: 'Math Block', icon: '∑', template: "$$\n\\text{math}\n$$" },
  { id: 'mermaid', label: 'Mermaid', icon: '🧬', template: "```mermaid\ngraph TD;\nA-->B;\n```" },
  { id: 'hr', label: 'Divider', icon: '—', template: '---' },
];
