import { 
  getGithubCasesTree, 
  getFileFromGithub 
} from './github';
import { marked } from 'marked';

// Cache objects kept in memory on the server
let serverTreeCache = [];
let serverRegistryCache = {};
let serverRawCache = {};
let serverHtmlCache = {};
let serverShaCache = {};
let serverGraphCache = { nodes: [], links: [] };
let cacheHydratedAt = 0;

const CACHE_TTL_MS = 300_000; // 5 minutes

function decodeContent(base64) {
  return Buffer.from(base64 || '', 'base64').toString('utf8');
}

function buildRegistryFromTree(tree) {
  const registry = {};
  const walk = (nodes, repoPath = '') => {
    for (const n of nodes || []) {
      if (n.kind === 'file') {
        const fullRepoPath = n.repoPath || (repoPath ? `${repoPath}/${n.name}` : n.name);
        const lowerFull = fullRepoPath.toLowerCase();
        const lowerName = (n.name || '').toLowerCase();
        const lowerNoExt = lowerName.replace(/\.md$/i, '');
        registry[lowerFull] = n.path;
        registry[lowerName] = n.path;
        registry[lowerNoExt] = n.path;
      } else if (n.kind === 'directory' && n.children) {
        walk(n.children, repoPath ? `${repoPath}/${n.name}` : n.name);
      }
    }
  };
  walk(tree);
  return registry;
}

function buildGraphFromRaw(rawMap) {
  const nodes = Object.keys(rawMap).map((id) => ({
    id,
    name: id.split('/').pop().replace(/\.md$/i, ''),
  }));

  const byFullPath = new Set(Object.keys(rawMap).map((k) => k.toLowerCase()));
  const byName = {};
  for (const path of Object.keys(rawMap)) {
    const nameOnly = path.split('/').pop().replace(/\.md$/i, '').toLowerCase();
    if (!byName[nameOnly]) byName[nameOnly] = path;
  }

  const links = [];
  for (const [source, raw] of Object.entries(rawMap)) {
    const matches = String(raw || '').match(/\[\[([^\]]+)\]\]/g) || [];
    for (const m of matches) {
      const targetRaw = m.slice(2, -2).trim();
      if (!targetRaw) continue;
      const targetLower = targetRaw.toLowerCase();
      let target = null;
      if (targetLower.endsWith('.md') && byFullPath.has(targetLower)) {
        target = Object.keys(rawMap).find((k) => k.toLowerCase() === targetLower) || null;
      } else if (byFullPath.has(`${targetLower}.md`)) {
        target = Object.keys(rawMap).find((k) => k.toLowerCase() === `${targetLower}.md`) || null;
      } else {
        target = byName[targetLower] || null;
      }
      if (target) links.push({ source, target, type: 'backlink' });
    }
  }

  return { nodes, links };
}

export async function hydrateServerCache(force = false) {
  const isFresh = Date.now() - cacheHydratedAt < CACHE_TTL_MS;
  if (!force && isFresh && serverTreeCache.length > 0) {
    return getCacheSnapshot();
  }

  const tree = await getGithubCasesTree();
  if (!Array.isArray(tree)) throw new Error('Failed to fetch cases from GitHub');

  const fileRepoPaths = [];
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.kind === 'file' && n.repoPath) fileRepoPaths.push(n.repoPath);
      if (n.children) walk(n.children);
    }
  };
  walk(tree);

  const nextRaw = {};
  const nextHtml = {};
  const nextSha = {};
  
  // Fetch contents in parallel
  await Promise.all(
    fileRepoPaths.map(async (repoPath) => {
      const fileData = await getFileFromGithub(repoPath);
      if (!fileData?.ok) return;
      const raw = decodeContent(fileData.content);
      nextRaw[repoPath] = raw;
      nextHtml[repoPath] = marked.parse(raw || '');
      if (fileData.sha) nextSha[repoPath] = fileData.sha;
    })
  );

  serverTreeCache = tree;
  serverRegistryCache = buildRegistryFromTree(tree);
  serverRawCache = nextRaw;
  serverHtmlCache = nextHtml;
  serverShaCache = nextSha;
  serverGraphCache = buildGraphFromRaw(nextRaw);
  cacheHydratedAt = Date.now();

  return getCacheSnapshot();
}

export function getCacheSnapshot() {
  const contentCache = {};
  for (const [key, raw] of Object.entries(serverRawCache)) {
    contentCache[key] = {
      raw,
      html: serverHtmlCache[key] || null,
      fetchedAt: cacheHydratedAt,
    };
  }
  return {
    tree: serverTreeCache,
    registry: serverRegistryCache,
    rawCache: serverRawCache,
    htmlCache: serverHtmlCache,
    shaCache: serverShaCache,
    contentCache,
    graph: serverGraphCache,
    hydratedAt: cacheHydratedAt,
  };
}

export function updateFileInCache(path, content, sha, html) {
  serverRawCache[path] = content;
  serverHtmlCache[path] = html || (typeof window === 'undefined' ? marked.parse(content) : content);
  if (sha) serverShaCache[path] = sha;
  serverGraphCache = buildGraphFromRaw(serverRawCache);
}

export function deleteFileFromCache(path) {
  delete serverRawCache[path];
  delete serverHtmlCache[path];
  delete serverShaCache[path];
  serverGraphCache = buildGraphFromRaw(serverRawCache);
}
