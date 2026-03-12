// src/app/api/cases/route.js
import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; 
const GITHUB_REPO = 'thienphucope/cases';
const EDIT_PASS = process.env.EDIT_PASS || 'default_hardcoded_pass';

const fileLocks = new Map();
const LOCK_TIMEOUT = 30000; // 30 seconds expiration

// ─── HELPER: build tree from github ──────────────────────────────────────────

async function getGithubCasesTree() {
  if (!GITHUB_TOKEN) {
    console.error("❌ [GitHub] GITHUB_TOKEN is not configured.");
    return null;
  }
  const branches = ["main", "master"];
  let data = null;
  let activeBranch = null;

  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`
  };

  for (const branch of branches) {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/git/trees/${branch}?recursive=1`;
    try {
      const resp = await fetch(url, { headers, cache: 'no-store' });
      if (resp.status === 200) {
        data = await resp.json();
        activeBranch = branch;
        break;
      }
    } catch (e) {
      console.error(`⚠️ [GitHub] Error on branch '${branch}':`, e.message);
    }
  }

  if (!data || !activeBranch) return null;

  try {
    const rawBaseUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${activeBranch}`;
    const root = [];
    const nodes = { "": root };
    const items = data.tree.sort((a, b) => a.path.localeCompare(b.path));

    for (const item of items) {
      const pathParts = item.path.split('/');
      const name = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join('/');
      if (pathParts.some(p => p.startsWith('.'))) continue;

      if (item.type === "tree") {
        const newFolder = { kind: "directory", name: name, children: [] };
        nodes[item.path] = newFolder.children;
        if (nodes[parentPath]) nodes[parentPath].push(newFolder);
      } else if (item.path.endsWith(".md")) {
        const newFile = { kind: "file", name: name, path: `${rawBaseUrl}/${item.path}` };
        if (nodes[parentPath]) nodes[parentPath].push(newFile);
      }
    }

    const sortTree = (tree) => {
      tree.sort((a, b) => {
        const typeA = a.kind === "directory" ? 0 : 1;
        const typeB = b.kind === "directory" ? 0 : 1;
        if (typeA !== typeB) return typeA - typeB;
        return a.name.localeCompare(b.name);
      });
      for (const item of tree) {
        if (item.kind === "directory") sortTree(item.children);
      }
      return tree;
    };
    return sortTree(root);
  } catch (e) {
    console.error(`❌ [GitHub] Process error:`, e.message);
    return null;
  }
}

// ─── HELPER: save to github ──────────────────────────────────────────────────

async function saveToGithub(path, content, create = false) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
  };

  let activeBranch = null;
  for (const branch of ["main", "master"]) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${branch}`, { headers });
      if (r.ok) { activeBranch = branch; break; }
    } catch {}
  }

  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  let existingSha = null;

  try {
    const getResp = await fetch(`${url}?ref=${activeBranch}`, { headers, cache: 'no-store' });
    if (getResp.ok) {
      const data = await getResp.json();
      existingSha = data.sha;
    }
  } catch {}

  if (create && existingSha) return { error: "File already exists" };
  if (!create && !existingSha) return { error: "File not found for update" };

  const encodedContent = Buffer.from(content).toString('base64');
  const payload = {
    message: `${existingSha ? 'Update' : 'Create'} ${path} via Red Vault`,
    content: encodedContent,
    branch: activeBranch,
  };
  if (existingSha) payload.sha = existingSha;

  const putResp = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  });

  if (putResp.ok) return { ok: true, path };
  const errorText = await putResp.text();
  return { error: `GitHub PUT error: ${errorText}` };
}

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

  // Extract 'action' alongside existing properties
  const { action, path, content, create = false, password } = body;
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  
  if (password !== EDIT_PASS) {
    console.warn(`❌ [API Route] Wrong password attempt.`);
    return NextResponse.json({ error: 'Wrong password' }, { status: 403 });
  }

  const finalPath = path.endsWith('.md') ? path : `${path}.md`;
  const now = Date.now();
  const currentLock = fileLocks.get(finalPath);
  const { sessionId } = body;

  // 1. Handle File Locking
  if (action === 'lock') {
    if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

    // If someone else holds the lock and it hasn't expired
    if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
      return NextResponse.json({ 
        ok: false, 
        error: 'File is being edited by another user', 
        locked: true 
      }, { status: 423 }); // 423 Locked
    }

    fileLocks.set(finalPath, { expiresAt: now + LOCK_TIMEOUT, sessionId });
    return NextResponse.json({ ok: true, locked: true });
  }

  // 2. Handle File Unlocking
  if (action === 'unlock') {
    if (currentLock && currentLock.sessionId === sessionId) {
      fileLocks.delete(finalPath);
    }
    return NextResponse.json({ ok: true });
  }

  // 3. Existing Save Logic
  if (typeof content !== 'string') return NextResponse.json({ error: 'Missing content' }, { status: 400 });
  
  // Check lock before saving
  if (currentLock && currentLock.expiresAt > now && currentLock.sessionId !== sessionId) {
    return NextResponse.json({ error: 'Lock lost or held by another user' }, { status: 423 });
  }
  
  console.log(`📝 [API Route] POST: Saving directly to GitHub...`);
  const result = await saveToGithub(finalPath, content, create);
  
  if (result.ok) {
    fileLocks.delete(finalPath); // Release lock after successful save
    console.log(`✅ [API Route] Saved to GitHub successfully.`);
    return NextResponse.json(result);
  } else {
    console.error(`❌ [API Route] GitHub save failed: ${result.error}`);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
}
