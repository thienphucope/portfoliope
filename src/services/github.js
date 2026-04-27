// src/services/github.js

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; 
const GITHUB_REPO = 'thienphucope/cases';

const buildHeaders = (withJson = false) => {
  const headers = {
    "Accept": "application/vnd.github+json",
    "User-Agent": "Portfolio-NextJS",
    "Authorization": `token ${GITHUB_TOKEN}`,
  };
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
};

async function detectActiveBranch(headers) {
  for (const branch of ["main", "master"]) {
    try {
      const r = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/branches/${branch}`, { headers });
      if (r.ok) return branch;
    } catch {}
  }
  return null;
}

// ─── HELPER: build tree from github ──────────────────────────────────────────

export async function getGithubCasesTree() {
  if (!GITHUB_TOKEN) {
    console.error("❌ [GitHub] GITHUB_TOKEN is not configured.");
    return null;
  }
  const branches = ["main", "master"];
  let data = null;
  let activeBranch = null;

  const headers = buildHeaders(false);

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
        const newFolder = { kind: "directory", name: name, path: item.path, children: [] };
        nodes[item.path] = newFolder.children;
        if (nodes[parentPath]) nodes[parentPath].push(newFolder);
      } else if (item.path.endsWith(".md")) {
        const newFile = { kind: "file", name: name, path: `${rawBaseUrl}/${item.path}`, repoPath: item.path };
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

// ─── HELPER: get from github ──────────────────────────────────────────────────

export async function getFileFromGithub(path) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  const headers = buildHeaders(false);
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  try {
    const resp = await fetch(url, { headers, cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, content: data.content, sha: data.sha }; // content is base64
    }
    return { error: `File not found: ${resp.status}` };
  } catch (e) {
    return { error: e.message };
  }
}

export async function getFileDate(path) {
  if (!GITHUB_TOKEN) return null;
  const headers = buildHeaders(false);
  // Get the latest commit for this file to get the last modified date
  const url = `https://api.github.com/repos/${GITHUB_REPO}/commits?path=${path}&per_page=1`;
  try {
    const resp = await fetch(url, { headers, cache: 'no-store' });
    if (resp.ok) {
      const commits = await resp.json();
      if (commits && commits.length > 0) {
        return commits[0].commit.committer.date; // ISO 8601 format
      }
    }
    return null;
  } catch (e) {
    console.error(`❌ [GitHub] Error fetching date for ${path}:`, e.message);
    return null;
  }
}

// ─── HELPER: save to github ──────────────────────────────────────────────────

export async function saveToGithub(path, content, create = false, sha = null) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  
  const headers = buildHeaders(true);
  const activeBranch = await detectActiveBranch(headers);

  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  let existingSha = sha;

  if (!existingSha) {
    try {
      const getResp = await fetch(`${url}?ref=${activeBranch}`, { headers, cache: 'no-store' });
      if (getResp.ok) {
        const data = await getResp.json();
        existingSha = data.sha;
      }
    } catch {}
  }

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

  if (putResp.ok) {
    const data = await putResp.json();
    return { ok: true, path, sha: data.content.sha };
  }
  const errorText = await putResp.text();
  return { error: `GitHub PUT error: ${errorText}` };
}

// ─── HELPER: delete from github ──────────────────────────────────────────────

export async function deleteFromGithub(path, sha) {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  const headers = buildHeaders(true);
  const activeBranch = await detectActiveBranch(headers);

  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  const payload = {
    message: `Delete ${path} via Red Vault`,
    sha: sha,
    branch: activeBranch,
  };

  const resp = await fetch(url, {
    method: 'DELETE',
    headers,
    body: JSON.stringify(payload)
  });

  if (resp.ok) return { ok: true };
  const errorText = await resp.text();
  return { error: `GitHub DELETE error: ${errorText}` };
}

// ─── HELPER: batch save (single commit for many files) ───────────────────────

export async function batchSaveToGithub(changes = {}, commitMessage = 'Batch update files via Red Vault') {
  if (!GITHUB_TOKEN) return { error: "Missing GITHUB_TOKEN" };
  const entries = Object.entries(changes).filter(([path, content]) => path && typeof content === 'string');
  if (entries.length === 0) return { ok: true, updated: 0 };

  const headers = buildHeaders(true);
  const activeBranch = await detectActiveBranch(headers);
  if (!activeBranch) return { error: "Could not detect GitHub branch" };

  const readRefUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/${activeBranch}`;
  const updateRefUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/refs/heads/${activeBranch}`;
  const refResp = await fetch(readRefUrl, { headers, cache: 'no-store' });
  if (!refResp.ok) return { error: `Failed to read branch ref: ${await refResp.text()}` };
  const refData = await refResp.json();
  const parentCommitSha = refData?.object?.sha;
  if (!parentCommitSha) return { error: 'Missing parent commit sha' };

  const commitUrl = `https://api.github.com/repos/${GITHUB_REPO}/git/commits/${parentCommitSha}`;
  const commitResp = await fetch(commitUrl, { headers, cache: 'no-store' });
  if (!commitResp.ok) return { error: `Failed to read parent commit: ${await commitResp.text()}` };
  const commitData = await commitResp.json();
  const baseTreeSha = commitData?.tree?.sha;
  if (!baseTreeSha) return { error: 'Missing base tree sha' };

  const treeEntries = [];
  for (const [path, content] of entries) {
    const blobResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, encoding: 'utf-8' }),
    });
    if (!blobResp.ok) return { error: `Failed to create blob for ${path}: ${await blobResp.text()}` };
    const blobData = await blobResp.json();
    treeEntries.push({
      path,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha,
    });
  }

  const treeResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries,
    }),
  });
  if (!treeResp.ok) return { error: `Failed to create tree: ${await treeResp.text()}` };
  const treeData = await treeResp.json();

  const newCommitResp = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [parentCommitSha],
    }),
  });
  if (!newCommitResp.ok) return { error: `Failed to create commit: ${await newCommitResp.text()}` };
  const newCommitData = await newCommitResp.json();

  const updateRefResp = await fetch(updateRefUrl, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitData.sha, force: false }),
  });
  if (!updateRefResp.ok) return { error: `Failed to update branch ref: ${await updateRefResp.text()}` };

  return { ok: true, updated: entries.length, commitSha: newCommitData.sha, branch: activeBranch };
}
