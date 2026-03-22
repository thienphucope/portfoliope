"use client";
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';

export default function GraphView({ allFiles, onSelectFile, searchTerm = '', activeNodeId = '' }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map(); // Maps node name (lowercase) to node id
    const degreeMap = new Map(); // Maps node id to its degree
    const tagNodeMap = new Map(); // Maps tag name (lowercase) to tag node id

    // First pass: Create file nodes and collect all unique tags
    allFiles.forEach(file => {
      const fileNode = {
        id: file.id,
        name: file.name.replace('.md', ''),
        val: 1,
        path: file.path,
        fileName: file.name,
        type: 'file' // Differentiate file nodes
      };
      nodes.push(fileNode);
      nodeMap.set(fileNode.name.toLowerCase(), fileNode.id);
      degreeMap.set(fileNode.id, 0);

      // Regex to find #tags, ignoring numbers only tags
      const tagRegex = /(?<!\S)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
      let tagMatch;
      if (file.fetchedContent) {
        while ((tagMatch = tagRegex.exec(file.fetchedContent)) !== null) {
          const tagName = tagMatch[1].trim().toLowerCase();
          if (!tagNodeMap.has(tagName)) {
            const tagNodeId = `tag-${tagName}`;
            tagNodeMap.set(tagName, tagNodeId);
            nodes.push({
              id: tagNodeId,
              name: `#${tagName}`,
              val: 1,
              type: 'tag' // Differentiate tag nodes
            });
            degreeMap.set(tagNodeId, 0);
          }
        }
      }
    });

    // Second pass: Create links (both backlinks and file-to-tag links)
    allFiles.forEach(file => {
      if (!file.fetchedContent) return;

      // Backlinks
      const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(file.fetchedContent)) !== null) {
        let targetName = linkMatch[1].trim().toLowerCase();
        let targetId = nodeMap.get(targetName);
        if (!targetId) {
          // Fallback search for partial matches
          for (const [name, id] of nodeMap.entries()) {
            if (name === targetName || name.split('/').pop() === targetName || name.replace('.md', '') === targetName) {
              targetId = id;
              break;
            }
          }
        }
        if (targetId && targetId !== file.id) {
          links.push({ source: file.id, target: targetId, type: 'backlink' });
          degreeMap.set(file.id, (degreeMap.get(file.id) || 0) + 1);
          degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        }
      }

      // File-to-tag links
      const tagRegex = /(?<!\S)#([a-zA-Z][a-zA-Z0-9_-]*)/g; // Re-use regex
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

  useEffect(() => {
    if (!graphRef.current || dimensions.width === 0) return;
    const fg = graphRef.current;

    const timer = setTimeout(() => {
      fg.d3Force('charge')?.strength(-200);
      fg.d3Force('link')?.distance(100).strength(1);
      
      // Use forceX/Y for centering, it's more stable
      fg.d3Force('x', forceX(0).strength(0.03));
      fg.d3Force('y', forceY(0).strength(0.03));
      fg.d3Force('center', null); // Disable default center force

      fg.resumeAnimation();
    }, 100);
    return () => clearTimeout(timer);
  }, [dimensions]);



  const handleNodeClick = useCallback(node => {
    onSelectFile(node.path, node.fileName, node.id);
  }, [onSelectFile]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'transparent' }}
    >
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={filteredData}
          nodeLabel={() => ""}
          backgroundColor="rgba(0,0,0,0)"
          onNodeClick={handleNodeClick}
          cooldownTicks={50}
          onEngineStop={() => {
            if (!graphRef.current) return;
            if (activeNodeId) {
              const node = filteredData.nodes.find(n => n.id.toLowerCase() === activeNodeId.toLowerCase());
              if (node && node.x !== undefined) {
                graphRef.current.centerAt(node.x, node.y, 800);
                graphRef.current.zoom(2, 800);
              }
            } else {
              graphRef.current.zoomToFit(400, 150);
            }
          }}
          linkColor={link => `rgba(255, 255, 255, ${link.opacity || 0.4})`}
          linkWidth={2}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const size = node.val;
            const isMatch = searchTerm ? node.opacity > 0.2 : true;
            const isActive = node.id === activeNodeId;
            
            // Add glow for active node (Yellow) or all nodes when zoomed in (White)
            // Or green for tag nodes
            if (isActive) {
              ctx.shadowColor = '#ffff00';
              ctx.shadowBlur = 25 / globalScale;
            } else if (node.type === 'tag') {
              ctx.shadowColor = '#00ff00'; // Green glow for tags
              ctx.shadowBlur = 15 / globalScale;
            } else if (globalScale > 1.5 && isMatch) {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 15 / globalScale;
            } else {
              ctx.shadowBlur = 0;
            }

            // Draw clean circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.type === 'tag' ? '#00cc00' : (isMatch ? '#ffffff' : 'rgba(255, 255, 255, 0.2)');
            ctx.fill();
            
            // High-contrast border for better definition
            if (isMatch || node.type === 'tag') { // Add tag type here
              ctx.strokeStyle = isActive ? '#ffff00' : (node.type === 'tag' ? '#008800' : 'rgba(255, 255, 255, 0.8)');
              ctx.lineWidth = (isActive ? 3 : (globalScale > 1.5 ? 1.5 : 1)) / globalScale;
              ctx.stroke();
            }

            // Reset shadow for label drawing
            ctx.shadowBlur = 0;

            // Labels: Only show if near mouse or it's the active node
            if (globalScale > 0.5 || isActive) {
              const fontSize = 11 / globalScale;
              ctx.font = `normal ${fontSize}px Lora, serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Text shadow for readability on video
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 4 / globalScale;
              
              ctx.fillStyle = isMatch ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
              ctx.fillText(label, node.x, node.y + size + (8 / globalScale));
              
              ctx.shadowBlur = 0; // Reset
            }
          }}

        />
      )}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap');
      `}</style>
    </div>
  );
}
