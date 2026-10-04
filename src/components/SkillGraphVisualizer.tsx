'use client';

import React, { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, CheckCircle2, Clock, AlertCircle, Info, Sparkles } from 'lucide-react';
import type { SkillNode, SkillEdge } from '@/types';

interface SkillGraphVisualizerProps {
  nodes: SkillNode[];
  edges: SkillEdge[];
  onSelectSkill?: (skill: SkillNode) => void;
}

interface PositionedNode extends SkillNode {
  x: number;
  y: number;
  layer: number;
}

export function SkillGraphVisualizer({
  nodes,
  edges,
  onSelectSkill,
}: SkillGraphVisualizerProps) {
  const [scale, setScale] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'partial' | 'missing'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute hierarchical layers (longest path from root / foundations)
  const layout = useMemo(() => {
    if (!nodes.length) return { positionedNodes: [], computedEdges: [], width: 900, height: 500 };

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const inDegreeMap = new Map<string, string[]>();
    const outDegreeMap = new Map<string, string[]>();

    nodes.forEach((n) => {
      inDegreeMap.set(n.id, []);
      outDegreeMap.set(n.id, []);
    });

    edges.forEach((e) => {
      if (inDegreeMap.has(e.target)) inDegreeMap.get(e.target)!.push(e.source);
      if (outDegreeMap.has(e.source)) outDegreeMap.get(e.source)!.push(e.target);
    });

    // Compute node layers using dynamic programming / topological depth
    const layers = new Map<string, number>();

    const getLayer = (id: string, visited = new Set<string>()): number => {
      if (layers.has(id)) return layers.get(id)!;
      if (visited.has(id)) return 0; // prevent cycle recursion
      visited.add(id);

      const prereqs = inDegreeMap.get(id) || [];
      if (prereqs.length === 0) {
        layers.set(id, 0);
        return 0;
      }

      let maxParentLayer = 0;
      for (const p of prereqs) {
        maxParentLayer = Math.max(maxParentLayer, getLayer(p, new Set(visited)));
      }

      const layer = maxParentLayer + 1;
      layers.set(id, layer);
      return layer;
    };

    nodes.forEach((n) => getLayer(n.id));

    // Group nodes by layer
    const layerGroups = new Map<number, SkillNode[]>();
    nodes.forEach((n) => {
      const l = layers.get(n.id) ?? 0;
      if (!layerGroups.has(l)) layerGroups.set(l, []);
      layerGroups.get(l)!.push(n);
    });

    const maxLayer = Math.max(...Array.from(layers.values()), 0);
    const colSpacing = 260;
    const rowSpacing = 95;
    const paddingX = 80;
    const paddingY = 60;

    let maxNodesInCol = 1;
    layerGroups.forEach((group) => {
      if (group.length > maxNodesInCol) maxNodesInCol = group.length;
    });

    const positionedNodes: PositionedNode[] = [];
    const nodePositionMap = new Map<string, { x: number; y: number }>();

    layerGroups.forEach((group, layerIndex) => {
      const colX = paddingX + layerIndex * colSpacing;
      const totalColHeight = (group.length - 1) * rowSpacing;
      const maxColHeight = (maxNodesInCol - 1) * rowSpacing;
      const startY = paddingY + (maxColHeight - totalColHeight) / 2;

      group.forEach((node, idx) => {
        const y = startY + idx * rowSpacing;
        const pNode: PositionedNode = {
          ...node,
          x: colX,
          y,
          layer: layerIndex,
        };
        positionedNodes.push(pNode);
        nodePositionMap.set(node.id, { x: colX, y });
      });
    });

    // Compute curved Bezier edge paths
    const computedEdges = edges
      .map((e) => {
        const sourcePos = nodePositionMap.get(e.source);
        const targetPos = nodePositionMap.get(e.target);
        if (!sourcePos || !targetPos) return null;

        const startX = sourcePos.x + 180;
        const startY = sourcePos.y + 24;
        const endX = targetPos.x;
        const endY = targetPos.y + 24;

        const deltaX = (endX - startX) * 0.5;
        const path = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;

        return {
          id: `${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
          path,
          strength: e.strength,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      source: string;
      target: string;
      path: string;
      strength: string;
    }>;

    const width = paddingX * 2 + (maxLayer + 1) * colSpacing;
    const height = Math.max(500, paddingY * 2 + maxNodesInCol * rowSpacing);

    return { positionedNodes, computedEdges, width, height };
  }, [nodes, edges]);

  const filteredNodes = useMemo(() => {
    if (filterStatus === 'all') return layout.positionedNodes;
    return layout.positionedNodes.filter((n) => n.status === filterStatus);
  }, [layout.positionedNodes, filterStatus]);

  // Determine highlighted connections for hovered or selected node
  const activeNodeId = hoveredNodeId || selectedNodeId;
  const connectedEdgeIds = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const set = new Set<string>();
    layout.computedEdges.forEach((e) => {
      if (e.source === activeNodeId || e.target === activeNodeId) {
        set.add(e.id);
      }
    });
    return set;
  }, [activeNodeId, layout.computedEdges]);

  const selectedNode = useMemo(() => {
    return layout.positionedNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, layout.positionedNodes]);

  return (
    <div className="relative border border-border rounded-xl bg-card overflow-hidden select-none">
      {/* Visualizer Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-border/80 bg-muted/20 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter Graph:
          </span>
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background text-xs">
            {(['all', 'mastered', 'partial', 'missing'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                  filterStatus === st
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span>Mastered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20" />
            <span>Missing</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.15, 1.8))}
            className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.5))}
            className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground text-xs"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="overflow-auto max-h-[640px] p-6 bg-radial-gradient relative scrollbar-thin">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: layout.width,
            height: layout.height,
            position: 'relative',
          }}
          className="transition-transform duration-150 ease-out"
        >
          {/* Layer Indicator Columns in Background */}
          <div className="absolute inset-0 pointer-events-none flex justify-between">
            {['Foundations', 'Core Concepts', 'Frameworks', 'Advanced & Cloud'].map((label, idx) => (
              <div
                key={label}
                className="border-r border-dashed border-border/40 text-[10px] uppercase font-bold text-muted-foreground/40 pl-2 pt-1"
                style={{ width: 260 }}
              >
                Stage {idx + 1}: {label}
              </div>
            ))}
          </div>

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: layout.width, height: layout.height }}
          >
            <defs>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="hsl(var(--muted-foreground)/0.4)" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="hsl(var(--primary))" />
              </marker>
            </defs>

            {/* Bezier Edges */}
            {layout.computedEdges.map((e) => {
              const isConnected = connectedEdgeIds.has(e.id);
              return (
                <path
                  key={e.id}
                  d={e.path}
                  fill="none"
                  stroke={isConnected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.25)'}
                  strokeWidth={isConnected ? 2.5 : 1.5}
                  strokeDasharray={e.strength === 'recommended' ? '4 3' : undefined}
                  markerEnd={isConnected ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                  className="transition-all duration-200"
                />
              );
            })}
          </svg>

          {/* Interactive HTML Nodes */}
          {layout.positionedNodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const isVisible = filterStatus === 'all' || node.status === filterStatus;

            return (
              <div
                key={node.id}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onSelectSkill?.(node);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  left: node.x,
                  top: node.y,
                  width: 180,
                  opacity: isVisible ? 1 : 0.25,
                }}
                className={`absolute cursor-pointer p-3 rounded-xl border text-xs shadow-sm transition-all duration-200 ${
                  node.status === 'mastered'
                    ? 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500 hover:shadow-emerald-500/10'
                    : node.status === 'partial'
                    ? 'border-amber-500/40 bg-amber-500/10 hover:border-amber-500 hover:shadow-amber-500/10'
                    : 'border-rose-500/40 bg-rose-500/10 hover:border-rose-500 hover:shadow-rose-500/10'
                } ${
                  isSelected || isHovered
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-20'
                    : 'z-10'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-foreground truncate">{node.name}</span>
                  {node.status === 'mastered' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : node.status === 'partial' ? (
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="capitalize">{node.category}</span>
                  <span className="font-mono font-medium">Lvl {node.level}/5</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="p-4 border-t border-border bg-card/95 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">{selectedNode.name}</h4>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  selectedNode.status === 'mastered'
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : selectedNode.status === 'partial'
                    ? 'bg-amber-500/15 text-amber-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}
              >
                {selectedNode.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current proficiency: Level {selectedNode.level} of 5 • Category: {selectedNode.category}
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs">
            {selectedNode.prerequisites.length > 0 && (
              <div>
                <span className="text-muted-foreground block text-[11px]">Prerequisites:</span>
                <span className="font-medium text-foreground">
                  {selectedNode.prerequisites.join(', ')}
                </span>
              </div>
            )}
            {selectedNode.dependents.length > 0 && (
              <div>
                <span className="text-muted-foreground block text-[11px]">Enables / Unlocks:</span>
                <span className="font-medium text-primary">
                  {selectedNode.dependents.join(', ')}
                </span>
              </div>
            )}
            <button
              onClick={() => setSelectedNodeId(null)}
              className="px-3 py-1 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
