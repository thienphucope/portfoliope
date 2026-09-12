"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceX, forceY } from 'd3-force';
import { useGraphData } from '../hooks/useGraphData';
import styles from '../styles/GraphView.module.css';

export default function GraphView({ allFiles, onSelectFile, searchTerm = '', activeNodeId = '', zoomToNodeId, onZoomComplete }) {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const onZoomCompleteRef = useRef(onZoomComplete);
  onZoomCompleteRef.current = onZoomComplete;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [needsZoom, setNeedsZoom] = useState(true);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [presentation, setPresentation] = useState(null);

  // Canvas cannot inherit CSS colors directly. Read the feature's presentation
  // tokens without changing graph data, simulation, sizing, or navigation.
  useEffect(() => {
    const css = getComputedStyle(containerRef.current);
    const color = (name) => css.getPropertyValue(`--graph-${name}`).trim();
    setPresentation({
      node: color('node'), nodeStroke: color('node-stroke'), active: color('active'),
      tag: color('tag'), tagStroke: color('tag-stroke'), label: color('label'),
      link: color('link'), linkActive: color('link-active'), linkDim: color('link-dim'),
      font: css.getPropertyValue('--archive-font-ui').trim(),
    });
  }, []);

  const { graphData } = useGraphData({ allFiles, searchTerm });

  const matchingNodeIds = useMemo(() => {
    if (!searchTerm || !graphData.nodes) return new Set();
    const term = searchTerm.toLowerCase();
    return new Set(graphData.nodes.filter(n => n.name.toLowerCase().includes(term)).map(n => n.id));
  }, [graphData.nodes, searchTerm]);

  // Center on active node when dimensions change
  useEffect(() => {
    if (graphRef.current && activeNodeId && dimensions.width > 0) {
      const node = graphData.nodes.find(n => n.id.toLowerCase() === activeNodeId.toLowerCase());
      if (node && node.x !== undefined) {
        graphRef.current.centerAt(node.x, node.y, 400);
      }
    }
  }, [dimensions, activeNodeId, graphData.nodes]);

  useEffect(() => {
    if (graphRef.current && zoomToNodeId && graphData.nodes.length > 0) {
      const node = graphData.nodes.find(n => n.id.toLowerCase() === zoomToNodeId.toLowerCase());
      if (node && node.x !== undefined) {
        const zoomLevel = node.type === 'tag' ? 1.2 : 3.0;
        graphRef.current.centerAt(node.x, node.y, 800);
        graphRef.current.zoom(zoomLevel, 800);
        if (onZoomCompleteRef.current) onZoomCompleteRef.current();
      }
    }
  }, [zoomToNodeId, graphData.nodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
          // Loại bỏ zoomToFit tự động ở đây để tránh bị thu nhỏ đột ngột
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeNodeId) { setNeedsZoom(true); setHoveredNodeId(null); }
  }, [activeNodeId]);

  useEffect(() => {
    if (!hoveredNodeId) { setHighlightNodes(new Set()); setHighlightLinks(new Set()); return; }
    const newNodes = new Set([hoveredNodeId]);
    const newLinks = new Set();
    graphData.links.forEach(link => {
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (s === hoveredNodeId) { newNodes.add(t); newLinks.add(link); }
      else if (t === hoveredNodeId) { newNodes.add(s); newLinks.add(link); }
    });
    setHighlightNodes(newNodes); setHighlightLinks(newLinks);
  }, [hoveredNodeId, graphData.links]);

  useEffect(() => {
    if (!graphRef.current || dimensions.width === 0) return;
    const fg = graphRef.current;
    const timer = setTimeout(() => {
      fg.d3Force('charge')?.strength(-1500);
      fg.d3Force('link')?.distance(100);
      fg.d3Force('x', forceX(0).strength(0.05));
      fg.d3Force('y', forceY(0).strength(0.05));
      fg.d3Force('center', null);
      fg.resumeAnimation();
    }, 100);
    return () => clearTimeout(timer);
  }, [dimensions]);

  return (
    <div ref={containerRef} className={styles.graph}>
      {dimensions.width > 0 && presentation && (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={() => ""}
          backgroundColor="rgba(0,0,0,0)"
          onNodeClick={node => node.type !== 'tag' && onSelectFile(node.path, node.fileName, node.id)}
          onNodeHover={node => { setHoveredNodeId(node ? node.id : null); if (containerRef.current) containerRef.current.style.cursor = node && node.type !== 'tag' ? 'pointer' : ''; }}
          onNodeDragStart={() => setNeedsZoom(false)}
          cooldownTicks={100}
          onEngineStop={() => {
            if (!graphRef.current) return;
            if (needsZoom && activeNodeId) {
              const node = graphData.nodes.find(n => n.id.toLowerCase() === activeNodeId.toLowerCase());
              if (node && node.x !== undefined) { graphRef.current.centerAt(node.x, node.y, 800); graphRef.current.zoom(2, 800); setNeedsZoom(false); }
            } else if (!activeNodeId && !searchTerm && !zoomToNodeId && needsZoom) {
              graphRef.current.zoomToFit(400, 100);
              setNeedsZoom(false);
            }
          }}
          linkColor={link => {
            if (searchTerm) {
              const s = typeof link.source === 'object' ? link.source.id : link.source;
              const t = typeof link.target === 'object' ? link.target.id : link.target;
              return matchingNodeIds.has(s) && matchingNodeIds.has(t) ? presentation.linkActive : presentation.linkDim;
            }
            return highlightLinks.size > 0 && !highlightLinks.has(link) ? presentation.linkDim : presentation.link;
          }}
          linkWidth={link => highlightLinks.has(link) ? 2 : 1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const size = node.val;
            const isSearchMatch = searchTerm ? matchingNodeIds.has(node.id) : true;
            const isActive = node.id === activeNodeId;
            const isHoverHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id);
            ctx.save();
            ctx.globalAlpha = (!searchTerm || isSearchMatch ? 1 : 0.15) * (isHoverHighlighted ? 1 : 0.3);
            ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = isActive ? presentation.active : (node.type === 'tag' ? presentation.tag : presentation.node);
            ctx.fill();
            ctx.strokeStyle = isActive ? presentation.active : (node.type === 'tag' ? presentation.tagStroke : presentation.nodeStroke);
            ctx.lineWidth = (isActive ? 3 : (globalScale > 1.5 ? 1.5 : 1)) / globalScale;
            ctx.stroke();
            if (isSearchMatch && ((node.type === 'tag' ? globalScale > 0.5 : globalScale > 1) || node.id === hoveredNodeId)) {
              ctx.font = `normal 12px ${presentation.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.fillStyle = presentation.label;
              ctx.fillText(node.name, node.x, node.y + size + 6);
            }
            ctx.restore();
          }}
        />
      )}
    </div>
  );
}
