"use client";
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';

export default function GraphView({ allFiles, onSelectFile, searchTerm = '', activeNodeId = '', zoomToNodeId, onZoomComplete }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [needsZoom, setNeedsZoom] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

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

  useEffect(() => {
    if (activeNodeId) {
      setNeedsZoom(true);
      setHoveredNodeId(null); // Clear hover when active node changes
    }
  }, [activeNodeId]);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const degreeMap = new Map();
    const tagNodeMap = new Map();

    allFiles.forEach(file => {
      const fileNode = {
        id: file.id,
        name: file.name.replace('.md', ''),
        val: 1,
        path: file.path,
        fileName: file.name,
        type: 'file'
      };
      nodes.push(fileNode);
      nodeMap.set(fileNode.name.toLowerCase(), fileNode.id);
      degreeMap.set(fileNode.id, 0);

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

  useEffect(() => {
    const centerNodeId = hoveredNodeId; // Only highlight based on hover
    if (!centerNodeId) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const newHighlightNodes = new Set([centerNodeId]);
    const newHighlightLinks = new Set();

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === centerNodeId) {
        newHighlightNodes.add(targetId);
        newHighlightLinks.add(link);
      } else if (targetId === centerNodeId) {
        newHighlightNodes.add(sourceId);
        newHighlightLinks.add(link);
      }
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
  }, [hoveredNodeId, graphData]);

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
      fg.d3Force('x', forceX(0).strength(0.03));
      fg.d3Force('y', forceY(0).strength(0.03));
      fg.d3Force('center', null);
      fg.resumeAnimation();
    }, 100);
    return () => clearTimeout(timer);
  }, [dimensions]);

  const handleNodeClick = useCallback(node => {
    if (node.type === 'tag') return;
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
          onNodeHover={node => {
            setHoveredNodeId(node ? node.id : null);
            if (containerRef.current) {
              containerRef.current.style.cursor = node && node.type !== 'tag' ? 'pointer' : '';
            }
          }}
          onNodeDragStart={() => setNeedsZoom(false)}
          cooldownTicks={50}
          onEngineStop={() => {
            if (!graphRef.current) return;
            if (zoomToNodeId) {
              const node = filteredData.nodes.find(n => n.id.toLowerCase() === zoomToNodeId.toLowerCase());
              if (node && node.x !== undefined) {
                graphRef.current.centerAt(node.x, node.y, 800);
                graphRef.current.zoom(4, 800);
                onZoomComplete();
              }
            } else if (needsZoom && activeNodeId) {
              const node = filteredData.nodes.find(n => n.id.toLowerCase() === activeNodeId.toLowerCase());
              if (node && node.x !== undefined) {
                graphRef.current.centerAt(node.x, node.y, 800);
                graphRef.current.zoom(2, 800);
                setNeedsZoom(false);
              }
            } else if (!activeNodeId) {
              graphRef.current.zoomToFit(400, 150);
            }
          }}
          linkColor={link => highlightLinks.size > 0 && !highlightLinks.has(link) ? 'rgba(100, 100, 100, 0.1)' : 'rgba(255, 255, 255, 0.4)'}
          linkWidth={link => highlightLinks.has(link) ? 2 : 1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const size = node.val;
            const isMatch = searchTerm ? node.opacity > 0.2 : true;
            const isActive = node.id === activeNodeId;
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);

            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';

            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);

            const fillStyle = isActive ? '#ffffff' : (node.type === 'tag' ? '#fece9e' : (isMatch ? '#808080' : 'rgba(128, 128, 128, 0.2)'));
            ctx.fillStyle = isHighlighted ? fillStyle : 'rgba(128, 128, 128, 0.1)';
            ctx.fill();

            if (isHighlighted) {
              const strokeStyle = isActive ? '#cccccc' : (node.type === 'tag' ? '#D2A77A' : (isMatch ? '#555555' : 'rgba(85, 85, 85, 0.4)'));
              ctx.strokeStyle = strokeStyle;
              ctx.lineWidth = (isActive ? 3 : (globalScale > 1.5 ? 1.5 : 1)) / globalScale;
              ctx.stroke();
            }

            const isLabelVisible = isHighlighted && (node.type === 'tag' || globalScale > 1 || isActive || node.id === hoveredNodeId);
            if (isLabelVisible) {
              const fontSize = 11 / globalScale;
              ctx.font = `normal ${fontSize}px Lora, serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
              ctx.shadowBlur = 4 / globalScale;
              ctx.fillStyle = isMatch ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
              ctx.fillText(label, node.x, node.y + size + (8 / globalScale));
              ctx.shadowBlur = 0;
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
