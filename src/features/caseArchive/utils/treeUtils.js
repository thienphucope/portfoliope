export function getAllFilesFromTree(nodes, repoPath = '') {
  let files = [];
  nodes.forEach((n) => {
    if (n.kind === 'file') {
      files.push({ id: repoPath ? `${repoPath}/${n.name}` : n.name, name: n.name, path: n.path });
    } else if (n.children) {
      files = files.concat(getAllFilesFromTree(n.children, repoPath ? `${repoPath}/${n.name}` : n.name));
    }
  });
  return files;
}
