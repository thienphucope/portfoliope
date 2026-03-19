"use client";
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function GraphView({ allFiles, onSelectFile, searchTerm = '', activeNodeId = '' }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoverPos, setHoverPos] = useState({ x: null, y: null });

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

  const handleMouseMove = useCallback((e) => {
    if (graphRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Convert screen coords to graph coords
      const graphCoords = graphRef.current.screen2GraphCoords(x, y);
      setHoverPos(graphCoords);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPos({ x: null, y: null });
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    const degreeMap = new Map();

    allFiles.forEach(file => {
      const node = {
        id: file.id,
        name: file.name.replace('.md', ''),
        val: 1,
        path: file.path,
        fileName: file.name
      };
      nodes.push(node);
      nodeMap.set(node.name.toLowerCase(), node.id);
      degreeMap.set(node.id, 0);
    });

    allFiles.forEach(file => {
      if (!file.fetchedContent) return;
      const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
      let match;
      while ((match = linkRegex.exec(file.fetchedContent)) !== null) {
        let targetName = match[1].trim().toLowerCase();
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
          links.push({ source: file.id, target: targetId });
          degreeMap.set(file.id, (degreeMap.get(file.id) || 0) + 1);
          degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
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
    if (graphRef.current) {
      // Set forces
      graphRef.current.d3Force('charge').strength(-100).distanceMax(250);
      graphRef.current.d3Force('link').distance(30).strength(1);
      graphRef.current.d3Force('center').strength(0.15);
      
      const performInitialZoom = () => {
        if (!graphRef.current || !activeNodeId) {
          graphRef.current?.zoomToFit(400, 100);
          return;
        }
        
        const findAndZoom = (attempts = 0) => {
          if (!graphRef.current) return;
          const liveNodes = graphRef.current.graphData().nodes;
          const liveNode = liveNodes.find(n => n.id === activeNodeId);
          
          if (liveNode && typeof liveNode.x === 'number' && typeof liveNode.y === 'number') {
            graphRef.current.centerAt(liveNode.x, liveNode.y, 1000);
            graphRef.current.zoom(3, 1000);
          } else if (attempts < 30) {
            setTimeout(() => findAndZoom(attempts + 1), 50);
          }
        };
        findAndZoom();
      };

      const timer = setTimeout(performInitialZoom, 300);
      return () => clearTimeout(timer);
    }
  }, [graphData, activeNodeId]); // Removed searchTerm from dependencies for camera movement

  const handleNodeClick = useCallback(node => {
    onSelectFile(node.path, node.fileName, node.id);
  }, [onSelectFile]);

  return (
    <div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
          linkColor={link => `rgba(255, 255, 255, ${link.opacity || 0.4})`}
          linkWidth={2}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const size = node.val;
            const isMatch = searchTerm ? node.opacity > 0.2 : true;
            const isActive = node.id === activeNodeId;
            
            // Check distance to mouse for label display
            let isNearMouse = false;
            if (hoverPos.x !== null && hoverPos.y !== null) {
              const dx = node.x - hoverPos.x;
              const dy = node.y - hoverPos.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              isNearMouse = dist < (100 / Math.sqrt(globalScale)); // Radius adjustments based on zoom
            }

            // Add glow for active node (Yellow) or all nodes when zoomed in (White)
            if (isActive) {
              ctx.shadowColor = '#ffff00';
              ctx.shadowBlur = 25 / globalScale;
            } else if (globalScale > 1.5 && isMatch) {
              ctx.shadowColor = '#ffffff';
              ctx.shadowBlur = 15 / globalScale;
            } else {
              ctx.shadowBlur = 0;
            }

            // Draw clean white circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = isMatch ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
            ctx.fill();
            
            // High-contrast border for better definition
            if (isMatch) {
              ctx.strokeStyle = isActive ? '#ffff00' : 'rgba(255, 255, 255, 0.8)';
              ctx.lineWidth = (isActive ? 3 : (globalScale > 1.5 ? 1.5 : 1)) / globalScale;
              ctx.stroke();
            }

            // Reset shadow for label drawing
            ctx.shadowBlur = 0;

            // Labels: Only show if near mouse or it's the active node
            if (isNearMouse || isActive) {
              const fontSize = 13 / globalScale;
              ctx.font = `${(isMatch || isActive) ? 'bold' : 'normal'} ${fontSize}px Lora, serif`;
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
          cooldownTicks={150}
        />
      )}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap');
      `}</style>
    </div>
  );
}
