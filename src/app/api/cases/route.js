// src/app/api/cases/route.js
import { NextResponse } from 'next/server';
import { 
  getGithubCasesTree, 
  getFileFromGithub, 
  saveToGithub, 
  deleteFromGithub,
  batchSaveToGithub,
} from '@/services/github';
import { handleAiRequest } from '@/services/ai';
import { marked } from 'marked';

const EDIT_PASS = process.env.EDIT_PASS || 'default_hardcoded_pass';
const fileLocks = new Map();
const LOCK_TIMEOUT = 30000; // 30 seconds expiration
const CACHE_TTL_MS = 300_000;

let serverTreeCache = [];
let serverRegistryCache = {};
let serverRawCache = {};
let serverHtmlCache = {};
let serverShaCache = {};
let serverGraphCache = { nodes: [], links: [] };
let cacheHydratedAt = 0;

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

async function hydrateServerCache(force = false) {
  const isFresh = Date.now() - cacheHydratedAt < CACHE_TTL_MS;
  if (!force && isFresh && serverTreeCache.length > 0) return;

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
}

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  try {
    await hydrateServerCache(false);
    return NextResponse.json(serverTreeCache);
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to fetch cases from GitHub' }, { status: 500 });
  }
}

// ─── POST: save or create a .md file ─────────────────────────────────────────

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { action, path, newPath, content, create = false, comment = false, password, sha, sessionId, query, history, username } = body;

  // 1. Handle AI requests
  if (action === 'ai') {
    try {
      const result = await handleAiRequest({ query, history, username });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  if (action === 'bootstrap') {
    try {
      await hydrateServerCache(true);
      const contentCache = {};
      for (const [key, raw] of Object.entries(serverRawCache)) {
        contentCache[key] = {
          raw,
          html: serverHtmlCache[key] || null,
          fetchedAt: cacheHydratedAt,
        };
      }
      return NextResponse.json({
        ok: true,
        tree: serverTreeCache,
        registry: serverRegistryCache,
        rawCache: serverRawCache,
        htmlCache: serverHtmlCache,
        contentCache,
        graph: serverGraphCache,
        hydratedAt: cacheHydratedAt,
      });
    } catch (e) {
      return NextResponse.json({ error: e.message || 'Bootstrap failed' }, { status: 500 });
    }
  }

  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  
  const finalPath = path.endsWith('.md') ? path : `${path}.md`;
  const now = Date.now();
  const currentLock = fileLocks.get(finalPath);

  // 1. Handle File Content Fetching (No password required, no lock)
  if (action === 'get') {
    try {
      // Refresh snapshot only when cache is stale (TTL-controlled).
      await hydrateServerCache(false);
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message || 'Failed to refresh server cache' }, { status: 500 });
    }

    if (!Object.prototype.hasOwnProperty.call(serverRawCache, finalPath)) {
      const fileData = await getFileFromGithub(finalPath);
      if (!fileData?.ok) return NextResponse.json({ ok: false, error: fileData?.error || 'Not found' }, { status: 404 });
      const raw = decodeContent(fileData.content);
      serverRawCache[finalPath] = raw;
      serverHtmlCache[finalPath] = marked.parse(raw || '');
      if (fileData.sha) serverShaCache[finalPath] = fileData.sha;
      serverGraphCache = buildGraphFromRaw(serverRawCache);
    }
    return NextResponse.json({
      ok: true,
      path: finalPath,
      raw: serverRawCache[finalPath] || '',
      html: serverHtmlCache[finalPath] || null,
      sha: serverShaCache[finalPath] || null,
      fromCache: true,
      tree: serverTreeCache,
      registry: serverRegistryCache,
      graph: serverGraphCache,
      hydratedAt: cacheHydratedAt,
    });
  }

  // 2. Handle File Locking & Getting latest content (No password required)
  if (action === 'lock') {
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
      return NextResponse.json({ ok: false, error: 'File is being edited by another user', locked: true }, { status: 423 });
    }
    fileLocks.set(finalPath, { expiresAt: now + LOCK_TIMEOUT, sessionId });
    const fileData = await getFileFromGithub(finalPath);
    if (fileData?.ok) {
      const raw = decodeContent(fileData.content);
      serverRawCache[finalPath] = raw;
      serverHtmlCache[finalPath] = marked.parse(raw || '');
      if (fileData.sha) serverShaCache[finalPath] = fileData.sha;
      serverGraphCache = buildGraphFromRaw(serverRawCache);
    }
    return NextResponse.json({ ok: true, locked: true, ...fileData });
  }

  // 2. Handle File Unlocking (No password required)
  if (action === 'unlock') {
    if (currentLock && currentLock.sessionId === sessionId) {
      fileLocks.delete(finalPath);
    }
    return NextResponse.json({ ok: true });
  }

  // 3. Password Check for destructive/modifying actions
  if (!create && !comment && password !== EDIT_PASS) {
    console.warn(`❌ [API Route] Wrong password attempt during modification.`);
    return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
  }

  // Check lock for modification actions
  if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
    return NextResponse.json({ error: 'Lock lost or held by another user' }, { status: 423 });
  }

  // 4. Handle Delete Action
  if (action === 'delete') {
    if (!sha) return NextResponse.json({ error: 'Missing sha' }, { status: 400 });
    console.log(`🗑️ [API Route] Deleting ${finalPath} from GitHub...`);
    const result = await deleteFromGithub(finalPath, sha);
    if (result.ok) {
      fileLocks.delete(finalPath);
      delete serverRawCache[finalPath];
      delete serverHtmlCache[finalPath];
      delete serverShaCache[finalPath];
      serverGraphCache = buildGraphFromRaw(serverRawCache);
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // 5. Handle Rename/Move Action
  if (action === 'rename') {
    if (!newPath) return NextResponse.json({ error: 'Missing newPath' }, { status: 400 });
    const finalNewPath = newPath.endsWith('.md') ? newPath : `${newPath}.md`;
    
    console.log(`🔄 [API Route] Renaming ${finalPath} to ${finalNewPath}...`);
    
    // 1. Get content of old path if not provided
    let finalContent = content;
    let finalSha = sha;
    if (!finalContent || !finalSha) {
      const oldData = await getFileFromGithub(finalPath);
      if (!oldData.ok) return NextResponse.json({ error: `Could not fetch old file: ${oldData.error}` }, { status: 404 });
      finalContent = Buffer.from(oldData.content, 'base64').toString('utf8');
      finalSha = oldData.sha;
    }

    // 2. Create new file
    const createResult = await saveToGithub(finalNewPath, finalContent, true);
    if (!createResult.ok) return NextResponse.json({ error: `Create new file failed: ${createResult.error}` }, { status: 500 });

    // 3. Delete old file
    const deleteResult = await deleteFromGithub(finalPath, finalSha);
    if (!deleteResult.ok) {
      console.error(`❌ [API Route] Rename failed deleting old path: ${finalPath}`);
      return NextResponse.json({ error: `Delete old file failed: ${deleteResult.error}` }, { status: 500 });
    }

    // 4. Update backlinks only (use graph cache instead of scanning all files)
    const oldBase = finalPath.replace('.md', '');
    const newBase = finalNewPath.replace('.md', '');
    const oldNameOnly = oldBase.split('/').pop();
    const newNameOnly = newBase.split('/').pop();

    console.log(`🔗 [Rename] Updating backlinks from graph cache...`);
    const backlinkFileIds = (serverGraphCache?.links || [])
      .filter((link) => link?.target === finalPath && link?.type === 'backlink')
      .map((link) => link.source);
    const uniqueBacklinks = Array.from(new Set(backlinkFileIds.filter((id) => id && id !== finalPath && id !== finalNewPath)));

    const changedFiles = {};
    if (uniqueBacklinks.length > 0) {
      const pathRegex = new RegExp(`\\[\\[${oldBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g');
      const nameRegex = new RegExp(`\\[\\[${oldNameOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g');

      for (const filePath of uniqueBacklinks) {
        let text = serverRawCache[filePath] || '';
        if (!text) {
          const fileData = await getFileFromGithub(filePath);
          if (!fileData?.ok) continue;
          text = Buffer.from(fileData.content || '', 'base64').toString('utf8');
        }

        const updated = text.replace(pathRegex, `[[${newBase}]]`).replace(nameRegex, `[[${newNameOnly}]]`);
        if (updated !== text) changedFiles[filePath] = updated;
      }

      const changedCount = Object.keys(changedFiles).length;
      if (changedCount > 0) {
        const batchResult = await batchSaveToGithub(
          changedFiles,
          `Update backlinks after renaming ${finalPath} -> ${finalNewPath}`
        );
        if (!batchResult.ok) {
          return NextResponse.json({ error: `Batch backlink update failed: ${batchResult.error}` }, { status: 500 });
        }
        for (const [changedPath, changedContent] of Object.entries(changedFiles)) {
          serverRawCache[changedPath] = changedContent;
          serverHtmlCache[changedPath] = marked.parse(changedContent || '');
        }
      }
    }

    fileLocks.delete(finalPath);
    await hydrateServerCache(true);
    return NextResponse.json({
      ok: true,
      path: finalNewPath,
      tree: serverTreeCache,
      changedFiles: {
        [finalNewPath]: serverRawCache[finalNewPath] || finalContent,
        ...changedFiles,
      },
      removedFiles: [finalPath],
      githubStatus: {
        rename: 'ok',
        backlinkBatch: Object.keys(changedFiles).length > 0 ? 'ok' : 'skipped',
      },
    });
  }

  // 6. Handle Save Logic (Existing)
  if (typeof content !== 'string') return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  
  console.log(`📝 [API Route] POST: Saving directly to GitHub...`);
  const result = await saveToGithub(finalPath, content, create, sha);
  
  if (result.ok) {
    fileLocks.delete(finalPath); // Release lock after successful save
    serverRawCache[finalPath] = content;
    serverHtmlCache[finalPath] = marked.parse(content || '');
    if (result.sha) serverShaCache[finalPath] = result.sha;
    serverGraphCache = buildGraphFromRaw(serverRawCache);
    console.log(`✅ [API Route] Saved to GitHub successfully.`);
    return NextResponse.json(result);
  } else {
    console.error(`❌ [API Route] GitHub save failed: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
