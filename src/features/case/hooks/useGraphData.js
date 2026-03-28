import { useMemo } from 'react';

/**
 * Hook for processing file list and content into graph nodes and links.
 * Used by GraphView.
 */
export function useGraphData({ allFiles, searchTerm }) {
  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const degreeMap = new Map();
    const tagNodeMap = new Map();

    allFiles.forEach(file => {
      const nameNoExt = file.name.replace('.md', '');
      const fileNode = {
        id: file.id,
        name: nameNoExt,
        val: 1,
        path: file.path,
        fileName: file.name,
        type: 'file'
      };
      nodes.push(fileNode);
      
      const lowerId = file.id.toLowerCase();
      const lowerName = file.name.toLowerCase();
      const lowerNameNoExt = nameNoExt.toLowerCase();
      
      nodeMap.set(lowerId, file.id);
      nodeMap.set(lowerName, file.id);
      nodeMap.set(lowerNameNoExt, file.id);
      
      if (!nodeMap.has(lowerNameNoExt)) {
        nodeMap.set(lowerNameNoExt, file.id);
      }

      degreeMap.set(file.id, 0);

      const tagRegex = /(?<!\S)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
      let tagMatch;
      if (file.fetchedContent) {
        while ((tagMatch = tagRegex.exec(file.fetchedContent)) !== null) {
          const tagName = tagMatch[1].trim().toLowerCase();
          if (!tagNodeMap.has(tagName)) {
            const tagNodeId = `tag-${tagName}`;
            tagNodeMap.set(tagName, tagNodeId);
            nodes.push({ id: tagNodeId, name: `#${tagName}`, val: 1, type: 'tag' });
            degreeMap.set(tagNodeId, 0);
          }
        }
      }
    });

    allFiles.forEach(file => {
      if (!file.fetchedContent) return;

      const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(file.fetchedContent)) !== null) {
        let targetName = linkMatch[1].trim().toLowerCase();
        let targetId = nodeMap.get(targetName);

        if (!targetId) {
          const targetBase = targetName.split('/').pop();
          targetId = nodeMap.get(targetBase);
        }

        if (targetId && targetId !== file.id) {
          links.push({ source: file.id, target: targetId, type: 'backlink' });
          degreeMap.set(file.id, (degreeMap.get(file.id) || 0) + 1);
          degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        }
      }

      const tagRegex = /(?<!\S)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
      let tagMatch;
      while ((tagMatch = tagRegex.exec(file.fetchedContent)) !== null) {
        const tagName = tagMatch[1].trim().toLowerCase();
        const tagNodeId = tagNodeMap.get(tagName);
        if (tagNodeId) {
          links.push({ source: file.id, target: tagNodeId, type: 'taglink' });
          degreeMap.set(file.id, (degreeMap.get(file.id) || 0) + 1);
          degreeMap.set(tagNodeId, (degreeMap.get(tagNodeId) || 0) + 1);
        }
      }
    });

    nodes.forEach(node => {
      const degree = degreeMap.get(node.id) || 0;
      node.val = 3 + Math.sqrt(degree) * 3;
    });

    return { nodes, links };
  }, [allFiles]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return graphData;
    const term = searchTerm.toLowerCase();
    const matchingNodeIds = new Set(
      graphData.nodes.filter(n => n.name.toLowerCase().includes(term)).map(n => n.id)
    );
    return {
      nodes: graphData.nodes.map(n => ({ ...n, opacity: matchingNodeIds.has(n.id) ? 1 : 0.15 })),
      links: graphData.links.map(l => ({
        ...l,
        opacity: (matchingNodeIds.has(l.source.id || l.source) && matchingNodeIds.has(l.target.id || l.target)) ? 0.8 : 0.05
      }))
    };
  }, [graphData, searchTerm]);

  return { graphData, filteredData };
}
