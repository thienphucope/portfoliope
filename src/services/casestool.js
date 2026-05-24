// src/services/casestool.js
import { hydrateServerCache, getCacheSnapshot } from './caseProvider.js';

async function ensureCache() {
  const snapshot = getCacheSnapshot();
  if (Object.keys(snapshot.rawCache).length === 0) {
    await hydrateServerCache(false);
  }
  return getCacheSnapshot();
}

function flattenTree(nodes, folder = '') {
  const files = [];
  for (const n of nodes || []) {
    if (n.kind === 'file') {
      files.push({
        name: n.name,
        path: n.repoPath || n.path,
        folder: folder || '(root)',
      });
    } else if (n.kind === 'directory' && n.children) {
      files.push(...flattenTree(n.children, folder ? `${folder}/${n.name}` : n.name));
    }
  }
  return files;
}

export const casesList = async () => {
  try {
    const snapshot = await ensureCache();
    const files = flattenTree(snapshot.tree);
    return { count: files.length, files };
  } catch (e) {
    return { error: e.message };
  }
};

export const casesRead = async ({ path }) => {
  try {
    const snapshot = await ensureCache();
    let raw = snapshot.rawCache[path];
    if (!raw && !path.endsWith('.md')) raw = snapshot.rawCache[`${path}.md`];
    if (!raw) {
      const registryPath = snapshot.registry[path.toLowerCase()];
      if (registryPath) raw = snapshot.rawCache[registryPath];
    }
    if (!raw) return { error: `File not found: ${path}` };
    return { path, content: raw };
  } catch (e) {
    return { error: e.message };
  }
};

export const casesSearch = async ({ query }) => {
  try {
    const snapshot = await ensureCache();
    const lower = query.toLowerCase();
    const results = [];
    for (const [path, raw] of Object.entries(snapshot.rawCache)) {
      const lowerRaw = (raw || '').toLowerCase();
      if (!lowerRaw.includes(lower)) continue;
      const idx = lowerRaw.indexOf(lower);
      const start = Math.max(0, idx - 100);
      const end = Math.min(raw.length, idx + query.length + 200);
      results.push({ path, snippet: raw.slice(start, end).trim() });
    }
    return { query, count: results.length, results };
  } catch (e) {
    return { error: e.message };
  }
};

export const casesListSchema = {
  type: "function",
  function: {
    name: "cases_list",
    description: "Liệt kê tất cả file note/case trong kho lưu trữ. Dùng khi cần biết có những file nào tồn tại, tên, đường dẫn và thư mục chứa chúng.",
    parameters: { type: "object", properties: {}, required: [] }
  }
};

export const casesReadSchema = {
  type: "function",
  function: {
    name: "cases_read",
    description: "Đọc nội dung đầy đủ của một file note/case cụ thể. Nhận tên file (vd: 'my-note', 'my-note.md') hoặc đường dẫn đầy đủ.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Tên file hoặc đường dẫn đầy đủ trong kho lưu trữ (vd: 'folder/my-note.md')."
        }
      },
      required: ["path"]
    }
  }
};

export const casesSearchSchema = {
  type: "function",
  function: {
    name: "cases_search",
    description: "Tìm kiếm từ khóa trong toàn bộ nội dung các file note/case. Trả về danh sách file có chứa từ khóa cùng đoạn trích xung quanh.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Từ khóa hoặc cụm từ cần tìm kiếm trong các note."
        }
      },
      required: ["query"]
    }
  }
};
