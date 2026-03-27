// src/app/api/cases/route.js
import { NextResponse } from 'next/server';
import { 
  getGithubCasesTree, 
  getFileFromGithub, 
  saveToGithub, 
  deleteFromGithub 
} from '@/services/github';
import { handleAiRequest } from '@/services/ai';

const EDIT_PASS = process.env.EDIT_PASS || 'default_hardcoded_pass';
const fileLocks = new Map();
const LOCK_TIMEOUT = 30000; // 30 seconds expiration

// ─── GET: fetch file tree ─────────────────────────────────────────────────────

export async function GET() {
  console.log(`📡 [API Route] GET Cases: Fetching from GitHub...`);
  const tree = await getGithubCasesTree();
  if (tree) {
    console.log(`✅ [API Route] Successfully fetched tree from GitHub`);
    return NextResponse.json(tree);
  }

  return NextResponse.json({ error: "Failed to fetch cases from GitHub. Check GITHUB_TOKEN and repository." }, { status: 500 });
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

  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  
  const finalPath = path.endsWith('.md') ? path : `${path}.md`;
  const now = Date.now();
  const currentLock = fileLocks.get(finalPath);

  // 1. Handle File Content Fetching (No password required, no lock)
  if (action === 'get') {
    const fileData = await getFileFromGithub(finalPath);
    return NextResponse.json({ ok: true, ...fileData });
  }

  // 2. Handle File Locking & Getting latest content (No password required)
  if (action === 'lock') {
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
      return NextResponse.json({ ok: false, error: 'File is being edited by another user', locked: true }, { status: 423 });
    }
    fileLocks.set(finalPath, { expiresAt: now + LOCK_TIMEOUT, sessionId });
    const fileData = await getFileFromGithub(finalPath);
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
      console.error(`⚠️ [API Route] Rename partial success: Created ${finalNewPath} but failed to delete ${finalPath}`);
      return NextResponse.json({ ok: true, partial: true, error: deleteResult.error });
    }

    // 4. Update links in other files
    const oldBase = finalPath.replace('.md', '');
    const newBase = finalNewPath.replace('.md', '');
    const oldNameOnly = oldBase.split('/').pop();
    const newNameOnly = newBase.split('/').pop();

    console.log(`🔗 [Rename] Updating links across repository...`);
    console.log(`🔗 [Rename] Patterns: [[${oldBase}]] -> [[${newBase}]], [[${oldNameOnly}]] -> [[${newNameOnly}]]`);

    const treeData = await getGithubCasesTree();
    if (treeData) {
      const allFiles = [];
      const collect = (nodes) => {
        for (const n of nodes) {
          if (n.kind === 'file' && n.repoPath !== finalNewPath) allFiles.push(n);
          if (n.children) collect(n.children);
        }
      };
      collect(treeData);

      console.log(`🔗 [Rename] Scanning ${allFiles.length} files for links...`);

      for (const file of allFiles) {
        const fileData = await getFileFromGithub(file.repoPath);
        if (fileData.ok) {
          let text = Buffer.from(fileData.content, 'base64').toString('utf8');
          let changed = false;

          const pathRegex = new RegExp(`\\[\\[${oldBase.replace(/\//g, '\\/')}\\]\\]`, 'g');
          if (pathRegex.test(text)) {
            text = text.replace(pathRegex, `[[${newBase}]]`);
            changed = true;
          }

          const nameRegex = new RegExp(`\\[\\[${oldNameOnly}\\]\\]`, 'g');
          if (nameRegex.test(text)) {
            text = text.replace(nameRegex, `[[${newNameOnly}]]`);
            changed = true;
          }

          if (changed) {
            console.log(`📝 [Rename] Updated links in: ${file.repoPath}`);
            await saveToGithub(file.repoPath, text, false, fileData.sha);
          }
        }
      }
      console.log(`🔗 [Rename] Link update complete.`);
    }

    fileLocks.delete(finalPath);
    return NextResponse.json({ ok: true, path: finalNewPath });
  }

  // 6. Handle Save Logic (Existing)
  if (typeof content !== 'string') return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  
  console.log(`📝 [API Route] POST: Saving directly to GitHub...`);
  const result = await saveToGithub(finalPath, content, create, sha);
  
  if (result.ok) {
    fileLocks.delete(finalPath); // Release lock after successful save
    console.log(`✅ [API Route] Saved to GitHub successfully.`);
    return NextResponse.json(result);
  } else {
    console.error(`❌ [API Route] GitHub save failed: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
