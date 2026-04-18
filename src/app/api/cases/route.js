// src/app/api/cases/route.js
import { NextResponse } from 'next/server';
import { 
  getFileFromGithub, 
  saveToGithub, 
  deleteFromGithub,
  batchSaveToGithub,
} from '@/services/github';
import { handleAiRequest } from '@/services/ai';
import { marked } from 'marked';
import { 
  hydrateServerCache, 
  getCacheSnapshot, 
  updateFileInCache, 
  deleteFileFromCache 
} from '@/services/caseProvider';

const EDIT_PASS = process.env.EDIT_PASS || 'default_hardcoded_pass';
const fileLocks = new Map();
const LOCK_TIMEOUT = 30000; // 30 seconds expiration

function decodeContent(base64) {
  return Buffer.from(base64 || '', 'base64').toString('utf8');
}

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  try {
    const snapshot = await hydrateServerCache(false);
    return NextResponse.json(snapshot.tree);
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
      const snapshot = await hydrateServerCache(true);
      return NextResponse.json({
        ok: true,
        ...snapshot
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
      await hydrateServerCache(false);
    } catch (e) {
      return NextResponse.json({ ok: false, error: e.message || 'Failed to refresh server cache' }, { status: 500 });
    }

    const snapshot = getCacheSnapshot();
    if (!Object.prototype.hasOwnProperty.call(snapshot.rawCache, finalPath)) {
      const fileData = await getFileFromGithub(finalPath);
      if (!fileData?.ok) return NextResponse.json({ ok: false, error: fileData?.error || 'Not found' }, { status: 404 });
      const raw = decodeContent(fileData.content);
      updateFileInCache(finalPath, raw, fileData.sha, marked.parse(raw || ''));
    }

    const updatedSnapshot = getCacheSnapshot();
    return NextResponse.json({
      ok: true,
      path: finalPath,
      raw: updatedSnapshot.rawCache[finalPath] || '',
      html: updatedSnapshot.htmlCache[finalPath] || null,
      sha: updatedSnapshot.shaCache[finalPath] || null,
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
      updateFileInCache(finalPath, raw, fileData.sha, marked.parse(raw || ''));
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
      deleteFileFromCache(finalPath);
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

    // 4. Update backlinks only
    const oldBase = finalPath.replace('.md', '');
    const newBase = finalNewPath.replace('.md', '');
    const oldNameOnly = oldBase.split('/').pop();
    const newNameOnly = newBase.split('/').pop();

    console.log(`🔗 [Rename] Updating backlinks...`);
    const currentSnapshot = getCacheSnapshot();
    const backlinkFileIds = (currentSnapshot.graph?.links || [])
      .filter((link) => link?.target === finalPath && link?.type === 'backlink')
      .map((link) => link.source);
    const uniqueBacklinks = Array.from(new Set(backlinkFileIds.filter((id) => id && id !== finalPath && id !== finalNewPath)));

    const changedFiles = {};
    if (uniqueBacklinks.length > 0) {
      const pathRegex = new RegExp(`\\[\\[${oldBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g');
      const nameRegex = new RegExp(`\\[\\[${oldNameOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]\\]`, 'g');

      for (const filePath of uniqueBacklinks) {
        let text = currentSnapshot.rawCache[filePath] || '';
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
          updateFileInCache(changedPath, changedContent, null, marked.parse(changedContent || ''));
        }
      }
    }

    fileLocks.delete(finalPath);
    await hydrateServerCache(true);
    const finalSnapshot = getCacheSnapshot();
    return NextResponse.json({
      ok: true,
      path: finalNewPath,
      tree: finalSnapshot.tree,
      changedFiles: {
        [finalNewPath]: finalSnapshot.rawCache[finalPath] || finalContent,
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
    updateFileInCache(finalPath, content, result.sha, marked.parse(content || ''));
    console.log(`✅ [API Route] Saved to GitHub successfully.`);
    return NextResponse.json(result);
  } else {
    console.error(`❌ [API Route] GitHub save failed: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
